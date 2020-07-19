import 'reflect-metadata';
import {
  Log,
  logInternalError,
  initializeConnection,
  isDevelopment,
  isTesting,
  isStaging,
  isProduction,
  MaxComplexityError,
  createSchema,
  IContext
} from 'gql-server';

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { verify } from 'jsonwebtoken';
import { ArgumentValidationError } from 'type-graphql';
import { ApolloError, ApolloServer } from 'apollo-server-express';
import { GraphQLError, separateOperations } from 'graphql';
import { getComplexity, simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';
import path from 'path';

import { ROLES, User } from './entity/user';

/**
 * Data contained in the
 * access and refresh tokens
 */
export interface TokenDecoded {
  userId: string;
  role: string;
}

/**
 * Creates the request auth object
 *
 * @param req Express Request
 * @param res Express Response
 * @param next Express Middleware Next
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  /**
   * Gets the access token from the headers authorization parameter
   */
  const accessToken = authHeader && authHeader.split(' ')[1];

  /**
   * Sets the default authorization
   * Overrides existing auth which might
   * not have come from a whitelisted resource
   *
   * The token is the only source of truth
   */
  req.auth = { ...req.auth, role: ROLES.anonymous, userId: null };

  /**
   * If an access token is passed,
   * verify the user and the user's role
   *
   * If verified, attach the appropriate auth to the user
   */
  if (accessToken) {
    try {
      const decoded = verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as TokenDecoded;
      const user = await User.findOne(decoded.userId);

      if (user && user.role === decoded.role) {
        req.auth = { ...req.auth, role: decoded.role, userId: decoded.userId };
      }
    } catch (e) {
      req.auth = { ...req.auth, role: ROLES.anonymous };
    }
  }

  next();
}

export function authChecker({ context }: { context: IContext }, roles: string[]) {
  /**
   * Roles array values come from @Authorized decorator arguments
   * If it's empty / contains anonymous
   * this means no authorization / authentication is required
   */
  if (roles.length < 1 || roles.includes(ROLES.anonymous)) return true;

  const { req } = context;
  const { role, userId } = req.auth;

  /**
   * If a specific role is required
   * this means that this requires a user to
   * have an account and therefore have an Id
   */
  if (!userId) return false;

  /**
   * Owner should be able to access any resources
   */
  if (role === ROLES.owner) return true;

  /**
   * Check if authorized
   */
  if (roles.includes(role)) return true;

  return false;
}

/**
 * Handles and transforms the errors
 *
 * Filters out errors that should
 * and shouldn't be shown to the user
 */
function formatGraphqlError(error: GraphQLError) {
  if (!isProduction()) return error;

  const genericError = new GraphQLError(`Internal Server Error: ${logInternalError(error)}`);

  if (error.message.includes('Database Error:')) return genericError;
  if (error instanceof ApolloError || error.originalError instanceof ApolloError) return error;
  if (error instanceof ArgumentValidationError || error.originalError instanceof ArgumentValidationError) {
    if (error.extensions) error.extensions.code = 'GRAPHQL_VALIDATION_FAILED';
    return error;
  }

  return genericError;
}

/**
 * Starting point of the server
 */
async function main() {
  const connection = await initializeConnection();

  if (!process.env.APPLICATION_NAME) throw new Error(`Application must be set up`);

  /**
   * NODE_ENV must be set one of the following
   */
  if (!isDevelopment() && !isTesting() && isStaging() && !isProduction())
    throw new Error(`NODE_ENV needs to be set up`);

  /**
   * Only run database migrations on production
   * as this might destroy existing data
   *
   * If database is currently in production
   * this needs to be manually set up
   */
  if (!isProduction()) await connection.runMigrations();

  const MAX_QUERY_COST = parseInt(process.env.GQL_MAX_QUERY_COST || '1000');

  const resolverPath = path.resolve(__dirname, `resolvers/**/!(*.test|*.spec).${isProduction() ? 'js' : 'ts'}`);

  const schema = await createSchema(resolverPath, authChecker);

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
    formatError: formatGraphqlError,
    introspection: !isProduction() || process.env.GQL_ENABLE_PLAYGROUND == 'true',
    playground: !isProduction() || process.env.GQL_ENABLE_PLAYGROUND == 'true',
    plugins: [
      {
        requestDidStart: () => ({
          didResolveOperation: ({ request, document }) => {
            /**
             * Calculate request complexity and set default field cost to 1
             *
             * If cost exceeds specified max query cost
             * throw an error and don't return data
             */
            const complexity = getComplexity({
              schema,
              query: request.operationName ? separateOperations(document)[request.operationName] : document,
              variables: request.variables,
              estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })]
            });

            try {
              let role = ROLES.member;

              if (request.http && request.http.headers && request.http?.headers.get('authorization')) {
                const authorization = request.http?.headers.get('authorization')?.split(' ')[1];
                const authDecoded = verify(authorization || '', process.env.GQL_SERVER_ACCESS_TOKEN_SECRET!);
                if (authDecoded && (authDecoded as any).role) role = (authDecoded as any).role;
              }

              if (complexity > MAX_QUERY_COST && role !== ROLES.owner)
                throw new MaxComplexityError(complexity, MAX_QUERY_COST);
            } catch (e) {
              if (complexity > MAX_QUERY_COST) throw new MaxComplexityError(complexity, MAX_QUERY_COST);
            }
          }
        })
      }
    ]
  });

  /**
   * Start up the server and setup middlewares
   */
  const app = express();
  app.use(cookieParser());
  app.use(cors({ credentials: true, origin: process.env.GQL_SERVER_ORIGIN }));
  app.use((req, res, next) => authenticateToken(req, res, next));

  server.applyMiddleware({ app });

  app.listen(process.env.GQL_SERVER_PORT || 5000, () => {
    Log.info(
      `Server ready at http://localhost:${process.env.GQL_SERVER_PORT || 5000}${server.graphqlPath} env: ${
        process.env.NODE_ENV
      }`
    );
  });
}

main().catch((e) => Log.fatal(e));

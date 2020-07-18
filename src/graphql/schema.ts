import { buildSchema, AuthChecker } from 'type-graphql';
import { GraphQLSchema } from 'graphql';
import { Request, Response } from 'express';
import { isProduction } from '../utilities/environment';
import path from 'path';

let schema: GraphQLSchema;

export interface IContext {
  req: Request;
  res: Response;
}

const DEFAULT_RESOLVER_GLOB = path.resolve(
  __dirname,
  '..',
  `resolvers/**/!(*.test|*.spec).${isProduction() ? 'js' : 'ts'}`
);

export async function createSchema(resolverGlob: string = DEFAULT_RESOLVER_GLOB, authChecker?: AuthChecker<IContext>) {
  if (!schema) {
    schema = await buildSchema({
      resolvers: [path.resolve(resolverGlob)],
      authChecker,
      authMode: 'null'
    });
  }
  return schema;
}

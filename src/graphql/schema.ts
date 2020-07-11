import {buildSchema, AuthChecker} from 'type-graphql';
import {GraphQLSchema} from "graphql"
import {Request, Response} from 'express';
import path from 'path';

let schema: GraphQLSchema;

export interface IContext {
  req: Request;
  res: Response;
}

export async function createSchema(resolverGlob: string, authChecker?: AuthChecker<IContext>) {
  if (!schema) {
    schema = await buildSchema({
      resolvers: [
        path.resolve(resolverGlob)
      ],
      authChecker,
      authMode: 'null'
    });
  }
}

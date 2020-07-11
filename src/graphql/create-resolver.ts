import {ClassType} from 'type-graphql';
import {Middleware} from 'type-graphql/dist/interfaces/Middleware';
import {IContext} from './schema';
import {IWhereFilter} from '../query/where-filter';

export type TEntityQueryable<T, Q extends IWhereFilter> = {
  [P in keyof T]?: Q;
}

export interface IBaseResolverParams<T> {
  EntityType: ClassType<T>;
  resource: string;
  accessLevels?: number[];
  middleware?: Middleware<any>;
  contextCallback?: (entity?: T, ctx?: IContext, data?: any) => Promise<T | null>;
}

export interface IResolverQueryableParams<T, Q extends IWhereFilter> extends IBaseResolverParams<T> {
  QueryableInputType?: ClassType<TEntityQueryable<T, Q>>;
}

export interface IResolverMutableParams<T, U> extends IBaseResolverParams<T> {
  MutationInputType: ClassType<U>;
}

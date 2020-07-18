import { ClassType, Resolver, Authorized, UseMiddleware, Query, Arg, Ctx, ID, Args, Mutation } from 'type-graphql';
import { Middleware } from 'type-graphql/dist/interfaces/Middleware';
import { IContext } from './schema';
import { IWhereFilter } from '../query/where-filter';
import { IConnectionDefinition, ConnectionArgs } from '../relay/connection';
import { capitalize } from '../utilities/string';
import { BaseEntity } from './base-entity';
import { getRepository } from 'typeorm';
import { plural } from 'pluralize';
import { IWhereAggregate } from '../query/reduce-aggregate';
import { GraphQLObjectType } from 'graphql';
import { createCursorConnection, ICursorConnection } from '../relay/cursor';
import { createQueryInput } from '../query/create-query-input';

export type TEntityQueryable<T> = {
  [P in keyof T]?: IWhereFilter;
};

export interface IBaseResolverParams<T extends BaseEntity> {
  EntityType: ClassType<T>;
  resource: string;
  accessLevels?: number[];
  middleware?: Middleware<any>[];
  contextCallback?: (
    entity?: T | ICursorConnection<T>,
    ctx?: IContext,
    data?: any
  ) => Promise<T | ICursorConnection<T> | null>;
}

export interface IResolverQueryableParams<T extends BaseEntity> extends IBaseResolverParams<T> {
  ConnectionType: IConnectionDefinition;
  QueryableInputType?: ClassType<TEntityQueryable<T>>;
}

export interface IResolverMutableParams<T extends BaseEntity, U> extends IBaseResolverParams<T> {
  MutationInputType: ClassType<U>;
  getCreatorId?: () => string;
}

export type TResolverResult<T> = Promise<T | ICursorConnection<T> | null | undefined>;

abstract class BaseGetResolver<T> {
  apply: (id: string, ctx: IContext) => TResolverResult<T>;
}

export function createGetResolver<T extends BaseEntity>(params: IBaseResolverParams<T>) {
  const { EntityType, resource, accessLevels, contextCallback, middleware } = params;

  @Resolver({ isAbstract: true })
  abstract class GetResolver {
    @Authorized(accessLevels || [])
    @UseMiddleware(middleware || [])
    @Query((returns) => EntityType, { name: `${resource}`, nullable: true })
    async apply(@Arg('id', (type) => ID) id: string, @Ctx() ctx: IContext) {
      const entity = await getRepository(EntityType).findOne({
        where: { id, archived: false }
      });
      if (typeof contextCallback === 'function') return await contextCallback(entity, ctx, { id });
      return entity;
    }
  }

  return GetResolver as BaseGetResolver<T>;
}

class BaseSearchResolver<T> {
  apply: (ctx: IContext, connArgs: ConnectionArgs, query: IWhereAggregate) => TResolverResult<T>;
}

export function createSearchResolver<T extends BaseEntity>(
  params: IResolverQueryableParams<T>
) {
  const {
    EntityType,
    QueryableInputType,
    ConnectionType,
    resource,
    accessLevels,
    contextCallback,
    middleware
  } = params;
  const WhereInputType = QueryableInputType ? createQueryInput(capitalize(resource), QueryableInputType) : null;

  @Resolver({ isAbstract: true })
  abstract class SearchResolver {
    @Authorized(accessLevels || [])
    @UseMiddleware(middleware || [])
    @Query((returns) => ConnectionType.Connection, {
      name: `${plural(resource)}`,
      nullable: true,
      complexity: ({ childComplexity, args }) => (args.first || args.last) * childComplexity
    })
    async apply(
      @Ctx() ctx: IContext,
      @Args() connArgs: ConnectionArgs,
      @Arg(`where`, () => WhereInputType || GraphQLObjectType, { nullable: true }) query?: IWhereAggregate
    ) {
      const queryBuilder = getRepository(EntityType).createQueryBuilder();
      const connection = await createCursorConnection({ queryBuilder, connArgs, query }, EntityType);
      if (typeof contextCallback === 'function')
        return await contextCallback(connection, ctx, { ...connArgs, ...query });
      return connection;
    }
  }

  return SearchResolver as BaseSearchResolver<T>;
}

class BaseInsertResolver<T, U> {
  apply: (data: U, ctx: IContext) => TResolverResult<T>;
}

export function createInsertResolver<T extends BaseEntity, U>(params: IResolverMutableParams<T, U>) {
  const { EntityType, MutationInputType, resource, accessLevels, contextCallback, middleware, getCreatorId } = params;

  @Resolver({ isAbstract: true })
  abstract class InsertResolver {
    @Authorized(accessLevels || [])
    @UseMiddleware(middleware || [])
    @Mutation((returns) => EntityType, {
      name: `${resource}Create`,
      nullable: true
    })
    async apply(@Arg('data', () => MutationInputType) data: U, @Ctx() ctx: IContext) {
      const entity = getRepository(EntityType).create(data);
      if (getCreatorId) entity.creatorId = getCreatorId();
      if (typeof contextCallback === 'function') return await contextCallback(entity, ctx, data);
      return await entity.save();
    }
  }

  return InsertResolver as BaseInsertResolver<T, U>;
}

class BaseUpdateResolver<T, U> {
  apply: (id: string, data: U, ctx: IContext) => TResolverResult<T>;
}

export function createUpdateResolver<T extends BaseEntity, U>(params: IResolverMutableParams<T, U>) {
  const { EntityType, MutationInputType, resource, accessLevels, contextCallback, middleware } = params;

  @Resolver({ isAbstract: true })
  abstract class UpdateResolver {
    @Authorized(accessLevels || [])
    @UseMiddleware(middleware || [])
    @Mutation((returns) => EntityType, {
      name: `${resource}Update`,
      nullable: true
    })
    async apply(@Arg('id', () => ID) id: string, @Arg('data', () => MutationInputType) data: U, @Ctx() ctx: IContext) {
      const existing = await getRepository(EntityType).findOne({
        where: { id, archived: false }
      });

      if (!existing) return null;
      const entity = getRepository(EntityType).merge(existing, data);
      entity.id = id;

      if (typeof contextCallback === 'function') return await contextCallback(entity, ctx, data);
      return await entity.save();
    }
  }

  return UpdateResolver as BaseUpdateResolver<T, U>;
}

class BaseDeleteResolver<T> {
  apply: (id: string, ctx: IContext) => TResolverResult<T>;
}

export function createDeleteResolver<T extends BaseEntity, U>(params: IResolverMutableParams<T, U>) {
  const { EntityType, MutationInputType, resource, accessLevels, contextCallback, middleware } = params;

  @Resolver({ isAbstract: true })
  abstract class DeleteResolver {
    @Authorized(accessLevels || [])
    @UseMiddleware(middleware || [])
    @Mutation((returns) => EntityType, {
      name: `${resource}Delete`,
      nullable: true
    })
    async apply(@Arg('id', () => ID) id: string, @Ctx() ctx: IContext) {
      const existing = await getRepository(EntityType).findOne({
        where: { id, archived: true }
      });

      if (!existing) return null;
      const entity = getRepository(EntityType).merge(existing);
      entity.archived = true;

      if (typeof contextCallback === 'function') return await contextCallback(entity, ctx);
      return await entity.save();
    }
  }

  return DeleteResolver as BaseDeleteResolver<T>;
}

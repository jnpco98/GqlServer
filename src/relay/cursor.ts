import { BaseEntity } from '../graphql/base-entity';
import { base64, unBase64 } from '../utilities/base64';
import { SelectQueryBuilder, Brackets } from 'typeorm';
import { ConnectionArgs } from './connection';
import { IWhereAggregate, reduceAggregate } from '../query/reduce-aggregate';
import { ClassType } from 'type-graphql';
import { DEFAULT_SORT_KEY, DEFAULT_DB_SORT_KEY } from './pagination';
import { InvalidSortKeyError } from './error';
import { PageInfo } from './page-info';

export interface ICursorDecoded {
  primary: number;
  secondary: string;
  type?: string;
}

function createCursor(node: BaseEntity, sortKey?: string) {
  let secondary = (node as any)[sortKey || '_'];
  if (typeof secondary === 'undefined') secondary = node.incrementId;

  const cursorEncoded: ICursorDecoded = {
    primary: node.incrementId,
    secondary,
    type: sortKey
  };

  return base64(JSON.stringify(cursorEncoded));
}

export function decodeCursor(cursor: string) {
  return JSON.parse(unBase64(cursor)) as ICursorDecoded;
}

export interface ICursorConnectionParams<T> {
  queryBuilder: SelectQueryBuilder<T>;
  connArgs: ConnectionArgs;
  query?: IWhereAggregate;
}

export interface ICursorConnection<T> {
  totalCount: number;
  pageInfo: PageInfo;
  edges: {
    node: T;
    cursor: string;
  }[];
}

export async function createCursorConnection<T extends BaseEntity>(
  connParams: ICursorConnectionParams<T>,
  EntityType: ClassType<T>
) {
  const { queryBuilder, connArgs, query } = connParams;
  const { sortKey = DEFAULT_SORT_KEY, reverse, pagination } = connArgs;

  queryBuilder.andWhere(new Brackets((qb) => qb.andWhere(`archived = :archived`, { archived: false })));

  const { limit, dbSortKey, direction } = pagination(EntityType, queryBuilder);

  if (query) reduceAggregate(queryBuilder, query);
  if (limit) queryBuilder.take(limit);

  const order = direction === 'backward' ? (reverse ? 'ASC' : 'DESC') : reverse ? 'DESC' : 'ASC';
  const [entities, count] = await queryBuilder
    .orderBy(dbSortKey, order, 'NULLS LAST')
    .addOrderBy(DEFAULT_DB_SORT_KEY, order)
    .getManyAndCount();

  const firstEdge = entities[0];
  const lastEdge = entities[entities.length - 1];

  if (sortKey && firstEdge && (firstEdge as any)[sortKey || ''] === undefined) throw new InvalidSortKeyError();

  const edges = entities.map((node) => ({
    node,
    cursor: createCursor(node, sortKey)
  }));

  if (direction === 'backward') edges.reverse();

  const hasNextPage = connArgs.first ? (count > entities.length ? true : false) : false;
  const hasPreviousPage = connArgs.last ? (count > entities.length ? true : false) : false;
  const startCursor = entities.length ? createCursor(firstEdge, sortKey) : null;
  const endCursor = entities.length ? createCursor(lastEdge, sortKey) : null;

  return {
    totalCount: count,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
      count: entities.length
    },
    edges
  } as ICursorConnection<T>;
}

import { SelectQueryBuilder, Brackets, getConnection } from "typeorm";
import { InvalidSortKeyError, CursorNotMatchingSortError, InvalidCursorError, InvalidPaginationArgumentError, InvalidPaginationError } from "./error";
import { BaseEntity } from "../graphql/base-entity";
import { ConnectionArgs } from "./connection";
import { ClassType } from "type-graphql";
import { decodeCursor } from "./cursor";

export type TPaginationDirection = 'forward' | 'backward';

export interface IPagination {
  limit?: number;
  dbSortKey: string;
  direction: TPaginationDirection;
}

export interface IConnectionProperties {
  [key: string]: {
    dbSortKey: string;
  }
}

export interface ICursorQueryAugment<T> {
  queryBuilder: SelectQueryBuilder<T>;
  cursor: string;
  sortKey: string;
  direction: TPaginationDirection;
  connectionProperties: IConnectionProperties;
}

export const DEFAULT_SORT_KEY = 'incrementId';
export const DEFAULT_DB_SORT_KEY = 'increment_id';

export type TPaginationMeta =
  | { type: 'forward'; after?: string; first: number }
  | { type: 'backward'; before?: string; last: number }
  | { type: 'none' };

function parsePagination(connArgs: ConnectionArgs): TPaginationMeta {
  const { first = 0, last = 0, after, before } = connArgs;

  if (!first && !last)
    throw new InvalidPaginationArgumentError('You must provide one of first or last');

  const paginatingForward = !!first || !!after;
  const paginatingBackward = !!last || !!before;

  if (paginatingForward && paginatingBackward)
    throw new InvalidPaginationError('Cannot paginate forward and backward at the same time');

  if ((paginatingForward && before) || (paginatingBackward && after))
    throw new InvalidPaginationArgumentError('Must use either first/after or last/before');

  if ((paginatingForward && first < 0) || (paginatingBackward && last < 0))
    throw new InvalidPaginationError('Pagination must be positive');

  if (last && !before)
    throw new InvalidPaginationArgumentError(
      'When paginating backwards, a "before" argument is required'
    );

  if (paginatingForward) return { type: 'forward', after, first };
  if (paginatingBackward) return { type: 'backward', before, last };
  return { type: 'none' };
}

function cursorToAugmentedQuery<T>(augment: ICursorQueryAugment<T>) {
  const { queryBuilder, cursor, direction, sortKey, connectionProperties } = augment;
  const { dbSortKey } = connectionProperties[sortKey];

  if(!Object.keys(connectionProperties).includes(sortKey))
    throw new InvalidSortKeyError();

  const operation = direction === 'backward' ? '<' : '>';

  try {
    const { primary, secondary, type } = decodeCursor(cursor);
    if (type !== sortKey) throw new CursorNotMatchingSortError();
    
    queryBuilder
      .andWhere(`${dbSortKey} ${operation}= :secondary`, { secondary })
      .andWhere(
        new Brackets((q) =>
          q
            .where(`${DEFAULT_DB_SORT_KEY} ${operation} :primary`, { primary })
            .orWhere(`${dbSortKey} ${operation} :secondary`, { secondary })
        )
      );
  } catch(e) {
    if (e instanceof CursorNotMatchingSortError) 
      throw new CursorNotMatchingSortError();
    throw new InvalidCursorError();
  }
}

function getConnectionProperties<T>(EntityType: ClassType<T>) {
  const connectionProperties = getConnection()
    .getMetadata(EntityType)
    .ownColumns.reduce((acc, col) => ({
      ...acc,
      [col.propertyName]: {
        dbSortKey: col.databaseName
      }
    }), {});

  return connectionProperties as IConnectionProperties;
}

export function getPagination<T extends BaseEntity>(
  connArgs: ConnectionArgs
): (EntityType: ClassType<T>, queryBuilder: SelectQueryBuilder<T>) => IPagination {
  return (EntityType, queryBuilder) => {
    const meta = parsePagination(connArgs);
    const connectionProperties = getConnectionProperties(EntityType);

    const sortKey = connArgs.sortKey || DEFAULT_SORT_KEY;
    const { dbSortKey } = connectionProperties[sortKey] || {};
    if (!dbSortKey) throw new InvalidSortKeyError();

    switch (meta.type) {
      case 'forward': {
        const { first, type, after } = meta;
        const params = { limit: first, dbSortKey, direction: type };
        if (after) {
          cursorToAugmentedQuery({ queryBuilder, cursor: after, direction: type, connectionProperties, sortKey });
        }
        return params;
      }
      case 'backward': {
        const { last, type, before } = meta;
        const params = { limit: last, dbSortKey, direction: type };
        if (before) {
          cursorToAugmentedQuery({ queryBuilder, cursor: before, direction: type, connectionProperties, sortKey });
        }
        return params;
      }
      default:
        return { dbSortKey, direction: 'forward' };
    }
  };
}

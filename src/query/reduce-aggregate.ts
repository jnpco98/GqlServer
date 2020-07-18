import { IWhereFilter } from './where-filter';
import { SelectQueryBuilder, Brackets } from 'typeorm';
import { reduceInput } from './reduce-input';

export interface IWhereAggregate {
  and?: IWhereFilter[];
  or?: IWhereFilter[];
}

export function reduceAggregate<T, U extends IWhereAggregate>(query: SelectQueryBuilder<T>, where: U) {
  if (!where) return query;

  Object.keys(where).forEach((key) => {
    if (key === 'or') {
      query.andWhere(
        new Brackets((qb) =>
          where[key]!.forEach((queryArray) => {
            reduceInput(qb, queryArray, 'orWhere');
          })
        )
      );
    } else if (key === 'and') {
      query.andWhere(
        new Brackets((qb) =>
          where[key]!.forEach((queryArray) => {
            reduceInput(qb, queryArray, 'andWhere');
          })
        )
      );
    }
  });
  return query;
}

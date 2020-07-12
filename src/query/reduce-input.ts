import {WhereExpression} from "typeorm";
import nanoid from "nanoid";
import {snakeCase} from "../utilities/string";

export const SEARCH_FIELD_LENGTH_LIMIT = 2000;

export interface IWhereFilterParams {
  [key: string]: any;
}

/**
 * Reduces where input to sql operations
 * - Operations
 *    - is: field value is equals the query value
 *    - not: field value is not equals the query value
 *    - in: field value is in the query set
 *    - notIn: field value is not in the query set
 *    - lt: field value is less than the query value
 *    - lte: field value is less than or equals the query value
 *    - gt: field value is greater than the query value
 *    - gte: field value is greater than or equals the query value
 *    - contains: field value contains the query value (notes#1)
 *    - notContains: field value doesn't contain the query value (notes#1)
 *    - startsWith: field value starts with the query value (notes#1)
 *    - notStartsWith: field value doesn't start with the query value (notes#1)
 *    - endsWith: field value ends with the query value (notes#1)
 *    - notEndsWith: field value doesn't end with the query value (notes#1)
 *    - search: field value contains any of the words from the query value (notes#1,2)
 * 
 * notes:
 * - 1: requires field and query value to be of type string
 * - 2: only works if the field value contains less than SEARCH_FIELD_LENGTH_LIMIT characters
 */
export function reduceInput(
  query: WhereExpression,
  where: IWhereFilterParams,
  andOr: 'andWhere' | 'orWhere'
) {
  const whereArgs = Object.entries(where);

  whereArgs.forEach((whereArg) => {
    const [fieldName, filters] = whereArg;
    const sFieldName = snakeCase(fieldName);
    const ops = Object.entries(filters);

    ops.forEach((parameters) => {
      const [operation, value] = parameters;
      const key = nanoid(10).replace(/\W+/g, '-');

      switch (operation) {
        case 'is': {
          query[andOr](`${sFieldName} = :${key}`, {[key]: value});
          break;
        }

        case 'not': {
          query[andOr](`${sFieldName} != :${key}`, {[key]: value});
          break;
        }

        case 'in': {
          query[andOr](`${sFieldName} IN (:...${key})`, {[key]: value});
          break;
        }

        case 'notIn': {
          query[andOr](`${sFieldName} NOT IN (:...${key})`, {
            [key]: value
          });
          break;
        }

        case 'lt': {
          query[andOr](`${sFieldName} < :${key}`, {[key]: value});
          break;
        }

        case 'lte': {
          query[andOr](`${sFieldName} <= :${key}`, {[key]: value});
          break;
        }

        case 'gt': {
          query[andOr](`${sFieldName} > :${key}`, {[key]: value});
          break;
        }

        case 'gte': {
          query[andOr](`${sFieldName} >= :${key}`, {[key]: value});
          break;
        }

        case 'contains': {
          query[andOr](`${sFieldName} ILIKE :${key}`, {
            [key]: `%${value}%`
          });
          break;
        }

        case 'notContains': {
          query[andOr](`${sFieldName} NOT ILIKE :${key}`, {
            [key]: `%${value}%`
          });
          break;
        }

        case 'startsWith': {
          query[andOr](`${sFieldName} ILIKE :${key}`, {
            [key]: `${value}%`
          });
          break;
        }

        case 'notStartsWith': {
          query[andOr](`${sFieldName} NOT ILIKE :${key}`, {
            [key]: `${value}%`
          });
          break;
        }

        case 'endsWith': {
          query[andOr](`${sFieldName} ILIKE :${key}`, {
            [key]: `%${value}`
          });
          break;
        }

        case 'notEndsWith': {
          query[andOr](`${sFieldName} ILIKE :${key}`, {
            [key]: `%${value}`
          });
          break;
        }

        case 'search': {
          if (
            (typeof value === 'string' || value instanceof String) &&
            value.trim().length &&
            value.length < SEARCH_FIELD_LENGTH_LIMIT
          ) {
            query[andOr](`${sFieldName} ILIKE :${key}`, {
              [key]: `%${value.replace(/\s/g, '%')}%`
            });
          }
          break;
        }

        default: {
          break;
        }
      }
    });
  });

  return query;
}

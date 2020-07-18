import { ApolloError } from 'apollo-server-express';

const COMPLEXITY_ERROR_CODE = 'GRAPHQL_COMPLEXITY_ERROR';

/**
 * Thrown when the precalculated
 * query complexity exceeds the
 * user's allotted cost
 */
export class MaxComplexityError extends ApolloError {
  constructor(cost: number, maxCost: number) {
    super(`Query has a cost of ${cost} which exceeds the user's allotted cost of ${maxCost}`, COMPLEXITY_ERROR_CODE);
  }
}

const PAGINATION_ERROR_CODE = 'GRAPHQL_PAGINATION_ERROR';

/**
 * Base pagination error
 */
export class InvalidPaginationError extends ApolloError {
  constructor(message: string) {
    super(message, PAGINATION_ERROR_CODE);
  }
}

/**
 * Thrown when a pagination
 * required argument wasn't provided
 *
 * ex:
 * Connection first or last wasn't provided
 * Before wasn't provided with last
 */
export class InvalidPaginationArgumentError extends InvalidPaginationError {
  constructor(message: string) {
    super(message);
  }
}

const CURSOR_ERROR_CODE = 'GRAPHQL_CURSOR_ERROR';

/**
 * Base Cursor Error
 * Thrown when the cursor is invalid
 *
 * ex:
 * Passed cursor can't be decoded (not a valid json)
 * Cursor doesn't contain the required properties
 */
export class InvalidCursorError extends ApolloError {
  constructor() {
    super('Invalid cursor', CURSOR_ERROR_CODE);
  }
}

/**
 * Thrown when the cursor properties
 * doesn't match the sort key
 */
export class CursorNotMatchingSortError extends ApolloError {
  constructor() {
    super("Cursor doesn't match the current sorting method");
  }
}

const SORT_ERROR_CODE = 'GRAPHQL_SORT_ERROR';

/**
 * Thrown when the sort key is not valid
 * for the current Graphql Object Type
 */
export class InvalidSortKeyError extends ApolloError {
  constructor() {
    super('Invalid sort key', SORT_ERROR_CODE);
  }
}

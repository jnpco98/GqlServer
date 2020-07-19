import { getRepository } from 'typeorm';
import { GraphQLObjectType } from 'graphql';
import { InputType, Field, Resolver, FieldResolver, Root, Args, Arg } from 'type-graphql';
import {
  StringWhere,
  createGetResolver,
  createSearchResolver,
  createInsertResolver,
  createUpdateResolver,
  createDeleteResolver,
  createConnectionDefinition,
  createCursorConnection,
  ConnectionArgs,
  IWhereAggregate
} from 'gql-server';

import { Book } from '../entity/book';
import { Chapter } from '../entity/chapter';
import { ChapterQueryInput, ChapterConnectionDefinition } from '../resolvers/chapter';

const BaseGetResolver = createGetResolver({
  EntityType: Book,
  resource: 'book'
});

/**
 * Filters for querying resource
 */
@InputType()
class BookQueryableInput {
  @Field((type) => StringWhere, { nullable: true })
  title?: StringWhere;

  @Field((type) => StringWhere, { nullable: true })
  description?: StringWhere;

  @Field((type) => StringWhere, { nullable: true })
  isbn?: StringWhere;
}

const ConnectionDefinition = createConnectionDefinition('book', Book);

const BaseSearchResolver = createSearchResolver({
  EntityType: Book,
  QueryableInputType: BookQueryableInput,
  ConnectionType: ConnectionDefinition,
  resource: 'book'
});

const BaseCreateResolver = createInsertResolver({
  EntityType: Book,
  MutationInputType: Book,
  resource: 'book'
});

const BaseUpdateResolver = createUpdateResolver({
  EntityType: Book,
  MutationInputType: Book,
  resource: 'book'
});

const BaseDeleteResolver = createDeleteResolver({
  EntityType: Book,
  MutationInputType: Book,
  resource: 'book'
});

/**
 * Book Create Resolver
 */
@Resolver()
export class BookCreateResolver extends BaseCreateResolver {}

/**
 * Book Get Resolver
 *
 * Gets a single resource using the resource id
 */
@Resolver()
export class BookGetResolver extends BaseGetResolver {}

/**
 * Book Update Resolver
 *
 * Updates a single resource using the resource id
 */
@Resolver()
export class BookUpdateResolver extends BaseUpdateResolver {}

/**
 * Book Delete Resolver
 *
 * Deletes a single resource using the resource id
 */
@Resolver()
export class BookDeleteResolver extends BaseDeleteResolver {}

/**
 * Book Search Resolver
 */
@Resolver((of) => Book)
export class BookSearchResolver extends BaseSearchResolver {
  /**
   * Returns a chapter relay connection
   * for the book entity
   */
  @FieldResolver((returns) => ChapterConnectionDefinition.Connection, {
    complexity: ({ childComplexity, args }) => (args.first || args.last) * childComplexity
  })
  async chapters(
    @Root() book: Book,
    @Args() connArgs: ConnectionArgs,
    @Arg(`where`, () => ChapterQueryInput || GraphQLObjectType, { nullable: true })
    query?: IWhereAggregate
  ): Promise<any> {
    const queryBuilder = getRepository(Chapter).createQueryBuilder();
    queryBuilder.andWhere('book_id = :isvalue', { isvalue: book.id });
    return await createCursorConnection(
      {
        queryBuilder,
        connArgs,
        query
      },
      Chapter
    );
  }
}

export { ConnectionDefinition as BookConnectionDefinition };

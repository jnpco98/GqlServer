import {Field, ObjectType} from 'type-graphql';

/**
 * Describes current page in accordance to
 * the graphql spec
 */
@ObjectType()
export class PageInfo {
  /**
   * Only valid when paginating with first and after
   * If there are elements after the current page
   * hasNextPage is true
   */
  @Field()
  hasNextPage: boolean;

  /**
   * Only valid when paginating with before and last
   * If there are elements before the current page
   * hasPreviousPage is true
   */
  @Field()
  hasPreviousPage: boolean;

  /**
   * Cursor of the first element in the list
   */
  @Field(() => String, {nullable: true})
  startCursor: String;

  /**
   * Cursor of the last element in the list
   */
  @Field(() => String, {nullable: true})
  endCursor: String;

  /**
   * Number of elements in the current page
   */
  @Field()
  count: number;
}

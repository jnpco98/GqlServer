import { createGetResolver, createSearchResolver, createInsertResolver, createUpdateResolver, createDeleteResolver, StringWhere, createConnectionDefinition, createQueryInput } from 'gql-server';
import { InputType, Field, Resolver } from 'type-graphql';
import { Chapter } from '../entity/chapter';

const BaseGetResolver = createGetResolver({
  EntityType: Chapter,
  resource: 'chapter'
}) as any;

/**
 * Filters for querying resource
 */
@InputType()
class ChapterQueryableInput {
  @Field((type) => StringWhere, { nullable: true })
  slug?: typeof StringWhere;

  @Field((type) => StringWhere, { nullable: true })
  novelId?: typeof StringWhere;

  @Field((type) => StringWhere, { nullable: true })
  title?: typeof StringWhere;
}

const ChapterConnectionDefinition = createConnectionDefinition('chapter', Chapter);

const BaseSearchResolver = createSearchResolver({
  EntityType: Chapter,
  QueryableInputType: ChapterQueryableInput,
  ConnectionType: ChapterConnectionDefinition,
  resource: 'chapter'
}) as any;

const BaseCreateResolver = createInsertResolver({
  EntityType: Chapter,
  MutationInputType: Chapter,
  resource: 'chapter'
}) as any;

const BaseUpdateResolver = createUpdateResolver({
  EntityType: Chapter,
  MutationInputType: Chapter,
  resource: 'chapter'
}) as any;

const BaseDeleteResolver = createDeleteResolver({
  EntityType: Chapter,
  MutationInputType: Chapter,
  resource: 'chapter'
}) as any;


/**
 * Chapter Create Resolver
 */
@Resolver()
export class ChapterCreateResolver extends BaseCreateResolver {}

/**
 * Chapter Get Resolver
 *
 * Gets a single resource using the resource id
 */
@Resolver()
export class ChapterGetResolver extends BaseGetResolver {}

/**
 * Chapter Update Resolver
 * 
 * Updates a single resource using the resource id
 */
@Resolver()
export class ChapterUpdateResolver extends BaseUpdateResolver {}

/**
 * Chapter Search Resolver
 */
@Resolver()
export class ChapterSearchResolver extends BaseSearchResolver {}

/**
 * Chapter Delete Resolver
 * 
 * Deletes a single resource using the resource id
 */
@Resolver()
export class ChapterDeleteResolver extends BaseDeleteResolver {}

const ChapterQueryInput = createQueryInput<Chapter, ChapterQueryableInput>('chapter', ChapterQueryableInput);
console.log(Object.keys(ChapterQueryInput))

export { ChapterConnectionDefinition, ChapterQueryInput };

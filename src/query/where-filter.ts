import { InputType, Field, ClassType } from 'type-graphql';

export interface IWhereFilter {
  [key: string]: any;
}

export function createWhereFilterInput<T>(FilterType: ClassType<T>) {
  @InputType({ isAbstract: true })
  abstract class WhereInput implements IWhereFilter {
    @Field((type) => FilterType, { nullable: true })
    is?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    not?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    in?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    notIn?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    lt?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    lte?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    gt?: typeof FilterType;

    @Field((type) => FilterType, { nullable: true })
    gte?: typeof FilterType;
  }

  return WhereInput as ClassType<IWhereFilter>;
}

@InputType()
export class NumberWhere extends createWhereFilterInput(Number) {}

@InputType()
export class StringWhere extends createWhereFilterInput(String) {
  @Field((type) => String, { nullable: true })
  contains?: String;

  @Field((type) => String, { nullable: true })
  notContains?: String;

  @Field((type) => String, { nullable: true })
  startsWith?: String;

  @Field((type) => String, { nullable: true })
  notStartsWith?: String;

  @Field((type) => String, { nullable: true })
  endsWith?: String;

  @Field((type) => String, { nullable: true })
  notEndsWith?: String;

  @Field((type) => String, { nullable: true })
  search?: String;
}

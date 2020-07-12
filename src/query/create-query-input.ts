import {TEntityQueryable} from "../graphql/resolver";
import {BaseEntity} from "../graphql/base-entity";
import {IWhereAggregate} from "./reduce-aggregate";
import {Field, InputType, ClassType} from "type-graphql";
import {IWhereFilter} from "./where-filter";

export function createQueryInput<T extends IWhereFilter, U extends TEntityQueryable<BaseEntity, T>>(resourceName: string, ReturnType: ClassType<U>) {
  @InputType(`${name}Where`)
  class WhereInput implements IWhereAggregate {
    @Field(type => [ReturnType], {nullable: true})
    or?: [typeof ReturnType];

    @Field(type => [ReturnType], {nullable: true})
    and?: [typeof ReturnType];
  }

  return WhereInput;
}

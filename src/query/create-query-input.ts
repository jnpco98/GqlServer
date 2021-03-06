import { TEntityQueryable } from '../graphql/resolver';
import { BaseEntity } from '../graphql/base-entity';
import { IWhereAggregate } from './reduce-aggregate';
import { Field, InputType, ClassType } from 'type-graphql';

export function createQueryInput<T extends BaseEntity, U extends TEntityQueryable<T>>(
  resourceName: string,
  ReturnType: ClassType<U>
): ClassType<IWhereAggregate> {
  @InputType(`${resourceName}Where`)
  class WhereInput implements IWhereAggregate {
    @Field((type) => [ReturnType], { nullable: true })
    or?: [typeof ReturnType];

    @Field((type) => [ReturnType], { nullable: true })
    and?: [typeof ReturnType];
  }

  return WhereInput;
}

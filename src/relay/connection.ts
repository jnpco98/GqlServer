import { ObjectType, ClassType, Field, ArgsType } from 'type-graphql';
import { BaseEntity } from '../graphql/base-entity';
import { PageInfo } from './page-info';
import { getPagination } from './pagination';

export interface IConnectionDefinition {
  Connection: ClassType;
  Edge: ClassType;
}

export function createConnectionDefinition<T extends ClassType<BaseEntity>>(resource: string, NodeType: T) {
  @ObjectType(`${resource}Edge`)
  class Edge {
    @Field(() => NodeType)
    node: T;

    @Field(() => String)
    cursor: String;
  }

  @ObjectType(`${resource}Connection`)
  class Connection {
    @Field()
    totalCount: number;

    @Field()
    pageInfo: PageInfo;

    @Field(() => [Edge])
    edges: Edge[];
  }

  return { Connection, Edge } as IConnectionDefinition;
}

@ArgsType()
export class ConnectionArgs {
  /**
   * Returns the elements that comes
   * before the specified cursor
   */
  @Field(() => String, {
    description: 'Returns the elements that come before the specified cursor',
    nullable: true
  })
  before?: string;

  /**
   * Returns the elements that comes
   * after the specified cursor
   */
  @Field(() => String, {
    description: 'Returns the elements that come after the specified cursor',
    nullable: true
  })
  after?: string;

  /**
   * Returns up to the first
   * n elements from the list
   */
  @Field({
    description: 'Returns up to the first n elements from the list',
    nullable: true
  })
  first?: number;

  /**
   * Returns up to the last
   * n elements from the list
   */
  @Field({
    description: 'Returns up to the last n elements from the list',
    nullable: true
  })
  last?: number;

  /**
   * Reverses the sorting of elements
   */
  @Field({ nullable: true, description: 'Reverse the order of the list' })
  reverse?: boolean;

  @Field({ nullable: true, description: 'Sort list by the given key' })
  sortKey?: string;

  get pagination() {
    return getPagination(this);
  }
}

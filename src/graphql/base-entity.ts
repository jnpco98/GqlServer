import {BaseEntity as ActiveRecordBaseEntity, PrimaryColumn, Column, Generated, BeforeInsert, BeforeUpdate} from 'typeorm';
import {ObjectType, Field, ID} from "type-graphql";
import nanoid from 'nanoid';

@ObjectType({isAbstract: true})
export abstract class BaseEntity extends ActiveRecordBaseEntity {
  @Field(type => ID, {name: 'id'})
  @PrimaryColumn({name: 'entity_id', type: 'text'})
  id: string;

  @Generated()('increment')
  @Column({name: 'increment_id', type: 'integer'})
  incrementId: number;

  @Field()
  @Column({name: 'created_at', type: 'bigint', default: () => "cast(date_part('epoch', CURRENT_TIMESTAMP) as bigint)"})
  createdAt: number;

  @Field()
  @Column({name: 'last_modified', type: 'bigint', default: () => "cast(date_part('epoch', CURRENT_TIMESTAMP) as bigint)"})
  lastModified: number;

  @Column({name: 'creator_id', nullable: true, type: 'text'})
  creatorId?: string;

  @Column({type: 'boolean', default: false})
  archived: boolean;

  @BeforeInsert()
  beforeInsert() {
    this.id = nanoid();
    this.createdAt = new Date().getTime();
    this.lastModified = new Date().getTime();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.lastModified = new Date().getTime();
  }
}

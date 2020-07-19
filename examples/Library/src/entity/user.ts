import { BaseEntity } from 'gql-server';
import { ObjectType, Field } from 'type-graphql';
import { Entity, Column } from 'typeorm';

/**
 * Access control roles
 */
export const ROLES = {
  anonymous: 'ANONYMOUS',
  member: 'MEMBER',
  moderator: 'MODERATOR',
  admin: 'ADMIN',
  owner: 'OWNER'
};

/**
 * Orm User Entity
 *
 * Graphql User Object Type
 *
 * Implements graphql validation
 */
@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @Column({ unique: true })
  username: string;

  /**
   * User's hashed password
   */
  @Column()
  password: string;

  @Field()
  @Column({ unique: true })
  email: string;

  /**
   * Decides what information and action
   * is accessible to the user
   */
  @Column({ default: ROLES.member })
  role: string;

  /**
   * Checks whether the email is verified
   */
  @Column({ default: true })
  confirmed: boolean;
}

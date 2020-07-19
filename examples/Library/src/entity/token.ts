import { Column, Entity } from 'typeorm';
import { Field, ObjectType } from 'type-graphql';
import { BaseEntity } from 'gql-server';

/**
 * ORM Refresh Token Entity
 *
 * Graphql Auth tokens Object Type
 *
 * Refresh tokens are stored in the database
 * and is used to generate access tokens
 */
@Entity()
@ObjectType()
export class AuthTokens extends BaseEntity {
  @Field()
  accessToken: string;

  @Field()
  @Column({ name: 'refresh_token', unique: true })
  refreshToken: string;
}

import { Entity, Column, BeforeInsert, BeforeUpdate } from "typeorm";
import { ObjectType, InputType, Field, ID } from "type-graphql";
import { MinLength, IsOptional } from "class-validator";
import { BaseEntity, slugify } from "gql-server";

/**
 * ORM Chapter Entity
 *
 * Graphql Chapter Object Type
 *
 * Also being used as the mutation type for
 * the Chapter Object Type
 *
 * Implements graphql validation
 */
@Entity()
@ObjectType()
@InputType('ChapterInput')
export class Chapter extends BaseEntity implements Partial<Chapter> {
  @Field()
  @Column({ type: 'text' })
  title: string;

  @Field()
  @Column({ type: 'float' })
  idx: number;

  @Field({ nullable: true })
  @Column({ type: 'text' })
  slug: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  @MinLength(20, { message: 'Content should be longer than 20 characters' })
  @IsOptional()
  content?: string;

  @Field((type) => ID, { nullable: true })
  @Column({ name: 'book_id', nullable: true })
  bookId?: string;
  
  @Field((type) => ID, { nullable: true })
  @Column({ name: 'previous_id', nullable: true })
  previousId?: string;
  
  @Field((type) => ID, { nullable: true })
  @Column({ name: 'next_id', nullable: true })
  nextId?: string;

  /**
   * Create slug on chapter create
   */
  @BeforeInsert()
  @BeforeUpdate()
  createSlug() {
    this.slug = slugify(this.title);
  }
}

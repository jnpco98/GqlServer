import { InputType, Field, Resolver, Mutation, Arg, Query, Ctx } from 'type-graphql';
import { Length, IsEmail } from 'class-validator';
import bcrypt from 'bcrypt';
import { IContext } from 'gql-server';
import { User } from '../entity/user';

/**
 * Required parameters to
 * create the user resource
 */
@InputType()
class UserCreateInput {
  @Field()
  @Length(6, 40, { message: 'Username should be between 6 to 40 characters' })
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  password: string;
}

/**
 * Creates a new user
 * with a unique email and username
 * and a hashed password
 */
@Resolver()
export class UserCreateResolver {
  @Mutation((returns) => User, { nullable: true })
  async userCreate(@Arg('data') { username, password, email }: UserCreateInput): Promise<User | null> {
    const user = new User();
    user.username = username;
    user.password = await bcrypt.hash(password, 12);
    user.email = email;

    await user.save();
    return user;
  }
}

/**
 * Gets the user's profile
 * Can currently only get accessed
 * by the logged in user
 */
@Resolver()
export class ProfileResolver {
  @Query((returns) => User, { nullable: true })
  async profile(@Ctx() { req }: IContext): Promise<User | null> {
    if (!req || !req.auth) return null;

    const { userId } = req.auth;

    if (userId) {
      const user = await User.findOne(userId);
      return user || null;
    }

    return null;
  }
}

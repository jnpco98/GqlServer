import { InputType, Field, Resolver } from 'type-graphql';
import { IsEmail } from 'class-validator';
import { createInsertResolver, generateToken } from 'gql-server';
import { AuthTokens } from '../entity/token';
import { User } from '../entity/user';
import bcrypt from 'bcrypt';

/**
 * Creating an auth token
 * requires user credentials
 */
@InputType()
export class TokenCreateInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  password: string;
}

/**
 * Refreshing an access token
 * requires user credentials and an
 * existing refresh token
 */
@InputType()
export class TokenRefreshInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  password: string;

  @Field()
  token: string;
}

const BaseCreateResolver = createInsertResolver({
  EntityType: AuthTokens,
  MutationInputType: TokenCreateInput,
  resource: 'token',
  contextCallback: async (entity, ctx, data) => {
    console.log(data);
    const { email, password } = data as TokenCreateInput;
    const user = await User.findOne({ where: { email, archived: false } });
    const userIsValid = await bcrypt.compare(password, user?.password || '');
    if (!user || !user.confirmed || !userIsValid) return null;

    /**
     * Each user can only have one
     * valid/active refresh token at once
     */
    const existingRefreshToken = await AuthTokens.findOne({
      where: {
        creatorId: user.id,
        archived: false
      }
    });

    const { refreshToken, accessToken } = generateToken({ userId: user.id, role: user.role });
    /**
     * If a refresh token already exists,
     * just return the existing refresh token
     * along with a newly created access token
     */
    if (existingRefreshToken) {
      const tokens = AuthTokens.create(existingRefreshToken);
      tokens.accessToken = accessToken;
      return tokens;
    }

    /**
     * Else return a new refresh token and access token
     * and save the token to the database
     */
    const tokens = new AuthTokens();
    tokens.refreshToken = refreshToken;
    tokens.accessToken = accessToken;
    tokens.creatorId = user.id;

    return await tokens.save();
  }
});

/**
 * Token Create Resolver
 */
@Resolver()
export class TokenCreateResolver extends BaseCreateResolver {}

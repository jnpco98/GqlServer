import { sign } from 'jsonwebtoken';

export interface IToken {
  [key: string]: any;
}

const refreshTokenSecret = process.env.GQL_SERVER_REFRESH_TOKEN_SECRET!;
const refreshTokenExpiration = process.env.GQL_SERVER_REFRESH_TOKEN_EXPIRATION!;
const accessTokenSecret = process.env.GQL_SERVER_ACCESS_TOKEN_SECRET!;
const accessTokenExpiration = process.env.GQL_SERVER_ACCESS_TOKEN_EXPIRATION!;

if (!refreshTokenSecret || !refreshTokenExpiration) throw new Error('Refresh tokens need to be set up');

if (!accessTokenSecret || !accessTokenExpiration) throw new Error('Access tokens need to be set up');

export function generateToken(data: IToken) {
  const refreshToken = sign(data, refreshTokenSecret, {
    expiresIn: refreshTokenExpiration
  });

  const accessToken = sign(data, accessTokenSecret, {
    expiresIn: accessTokenExpiration
  });

  return { refreshToken, accessToken };
}

/**
 * Extending request and response types with
 * authentication and authorization
 */
declare namespace Express {
  export interface Request {
    auth: {
      userId: string | null;
      role: string;
    };
  }

  export interface Response {}
}

import { getConnectionOptions, createConnection } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { environment, isProduction } from './environment';
import { Log } from './log';

const username = process.env.GQL_DB_USERNAME!;
const password = process.env.GQL_DB_PASSWORD!;
const port = process.env.GQL_DB_PORT!;
const db = process.env.GQL_DB_NAME!;
const host = process.env.GQL_SERVER_HOST!;

export interface IDropDatabaseGuardOptions {
  drop?: boolean;
  database?: string;
}

async function buildConfiguration() {
  const configuration = await getConnectionOptions(environment);

  const connectionParams: { [key: string]: any } = {
    ...configuration,
    name: 'default'
  };

  if (!isProduction()) {
    connectionParams.username = username;
    connectionParams.password = password;
    connectionParams.host = host;
    connectionParams.port = port;
    connectionParams.database = db;
  }
  return connectionParams;
}

export async function initializeConnection(dropDatabaseGuardOptions: IDropDatabaseGuardOptions = {}) {
  if (!username || !password || !host || !port || !db) throw new Error('Database env has not been setup properly');

  const { drop, database } = dropDatabaseGuardOptions;
  const connectionParams = await buildConfiguration();

  if (drop && database === connectionParams.database) {
    connectionParams.synchronize = drop;
    connectionParams.dropSchema = drop;
  }

  return await createConnection(connectionParams as PostgresConnectionOptions);
}

export async function resetDatabase(database: string) {
  Log.warn(`Dropping ${database}`);
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await initializeConnection({ drop: true, database });
  Log.info('Database reset success');
  process.exit(0);
}

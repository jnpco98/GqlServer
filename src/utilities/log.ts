import log4js from 'log4js';
import {applicationName, environment} from './environment';
import nanoid from 'nanoid';

function getBaseLoggerFilename() {
  return `logs/${applicationName}/${environment}`;
}

const appenderOptions = {
  type: 'dateFile',
  pattern: 'yyyy-MM-dd.log',
  alwaysIncludePattern: true

};

const appenders = {
  out: {type: 'stdout'},
  trace: {...appenderOptions, filename: `${getBaseLoggerFilename()}/trace/trace`},

  error: {...appenderOptions, filename: `${getBaseLoggerFilename()}/error/error`},
  errorFilter: {
    type: 'logLevelFilter',
    appender: 'error',
    level: 'error',
    maxLevel: 'error'

  },

  warn: {...appenderOptions, filename: `${getBaseLoggerFilename()}/warn/warn`},
  warnFilter: {
    type: 'logLevelFilter',
    appender: 'warn',
    level: 'warn',
    maxLevel: 'warn'

  },

  fatal: {...appenderOptions, filename: `${getBaseLoggerFilename()}/fatal/fatal`},
  fatalFilter: {
    type: 'logLevelFilter',
    appender: 'fatal',
    level: 'fatal',
    maxLevel: 'fatal'

  }
}

const categories = {
  default: {
    appenders: ['out', 'trace', 'errorFilter', 'warnFilter', 'fatalFilter'],
    level: 'debug'
  }
}

function configureLogger() {
  log4js.configure({
    appenders, categories
  });
}

configureLogger();

export function logInternalError(error: Error) {
  const errorId = nanoid();
  log4js.getLogger().error(`[${Date.now()}] Error ${errorId}`);
  log4js.getLogger().error(error);
  return errorId;
}

export default log4js.getLogger();

import { AxiosError } from 'axios';
import chalk from 'chalk';
import highlight from 'cli-highlight';
import { TransformableInfo } from 'logform';
import { EOL } from 'os';
import util from 'util';
import winston from 'winston';

interface ConfigureLoggerParams {
  quiet?: number;
  verbose?: number;
}

const levels = ['crit', 'error', 'warn', 'info', 'verbose', 'silly'] as const;
const DEFAULT_LEVEL = levels.findIndex(level => level === 'info');
const padding = Math.max(...levels.map(({ length }) => length));

function headerCase(header: string): string {
  return header.replace(/(^|-)\w/g, a => a.toUpperCase());
}

function httpErrorToString(error: AxiosError): string {
  const { request, response } = error;
  return [
    chalk.blue.bold('Request:'),
    highlight(
      [
        `${request.method} ${request.path} HTTP/${request.res.httpVersion}`,
        ...Object.entries(request.getHeaders())
          .map(([key, value]) => [headerCase(key), value])
          .map(([key, value]) => `${key}: ${key === 'Authorization' ? 'xxxxxxxxxx' : value}`)
          .sort(),
      ].join(EOL),
      { language: 'http', ignoreIllegals: true },
    ),
    '',
    chalk.blue.bold('Response:'),
    highlight(
      [
        `HTTP/${request.res.httpVersion} ${response.status} ${response.statusText}`,
        ...Object.entries(response.headers)
          .map(([key, value]) => [headerCase(key), value])
          .map(pair => pair.join(': '))
          .sort(),
        '',
        response.data instanceof Object ? JSON.stringify(response.data, null, 2) : response.data,
      ].join(EOL),
      { language: 'http', ignoreIllegals: true },
    ),
  ].join(EOL);
}

function toString(info: TransformableInfo): string {
  if (info instanceof Error) {
    if (info.request && info.response) {
      return httpErrorToString((info as Error) as AxiosError);
    }
    return info.stack;
  }
  if (typeof info.message === 'string') {
    return info.message;
  }
  return util.inspect(info.message, { colors: true });
}

/**
 * The default logger for NodeJS Appsemble projects.
 */
export const logger = winston.createLogger({
  level: levels[DEFAULT_LEVEL],
  levels: levels.reduce((acc, level, index) => ({ ...acc, [level]: index }), {}),
  format: winston.format.combine(
    winston.format(info => ({
      ...info,
      lines: toString(info)
        .split(/\r?\n/)
        .map(line => `${''.padEnd(padding - info.level.length)}${line}`),
    }))(),
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, lines, timestamp }) =>
      lines.map((line: string) => `${timestamp} [${level}]: ${line}`).join(EOL),
    ),
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Set the logging level using a string or numeric value.
 *
 * @param verbosity
 */
export function setLogLevel(level: number | string = DEFAULT_LEVEL): void {
  logger.level = Number.isNaN(Number(level))
    ? (level as string)
    : levels[Math.min(Math.max(level as number, 0), levels.length - 1)];
  logger.silly(`Logging level set to ${logger.level}`);
}

/**
 * Configure logging using named quiet and verbose parameters.
 *
 * Use this in conjunction with `yargs`.
 *
 * @param {Object} argv
 * @param {number} argv.quiet The negative verbosity count.
 * @param {number} argv.verbose The verbosity count.
 */
export function configureLogger({ quiet = 0, verbose = 0 }: ConfigureLoggerParams): void {
  process.on('warning', warning => {
    logger.warn(warning);
  });

  process.on('unhandledRejection', error => {
    logger.error(error);
  });

  setLogLevel(DEFAULT_LEVEL + verbose - quiet);
}

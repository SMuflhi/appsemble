import { AppsembleError, logger } from '@appsemble/node-utils';
import Umzug from 'umzug';

import migrations, { createMigration } from '../migrations';
import setupModels from '../utils/setupModels';
import databaseBuilder from './builder/database';

export const command = 'migrate';
export const description = 'Migrate the Appsemble database.';

export function builder(yargs) {
  return databaseBuilder(yargs)
    .option('migrate-to', {
      desc: 'Id of database version to migrate to.',
    })
    .option('migrate-from', {
      desc: 'Id of database version to migrate from.',
    });
}

export async function handler(argv) {
  const { migrateTo: to, migrateFrom: from } = argv;
  let db;
  try {
    db = await setupModels({
      host: argv.databaseHost,
      dialect: argv.databaseDialect,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      uri: argv.databaseUrl,
    });
  } catch (dbException) {
    switch (dbException.name) {
      case 'SequelizeConnectionError':
      case 'SequelizeAccessDeniedError':
        throw new AppsembleError(`${dbException.name}: ${dbException.original.sqlMessage}`);
      case 'SequelizeHostNotFoundError':
        throw new AppsembleError(
          `${dbException.name}: Could not find host ´${dbException.original.hostname}:${
            dbException.original.port
          }´`,
        );
      case 'SequelizeConnectionRefusedError':
        throw new AppsembleError(
          `${dbException.name}: Connection refused on address ´${dbException.original.address}:${
            dbException.original.port
          }´`,
        );
      default:
        throw dbException;
    }
  }

  const umzug = new Umzug({
    logging: entry => logger.info(entry),
    storage: 'sequelize',
    storageOptions: { sequelize: db },
    migrations: migrations.map(migration =>
      createMigration(db.getQueryInterface(), db.Sequelize, migration),
    ),
  });

  const result = await umzug.up({ ...(to && { to }), ...(from && { from }) });
  logger.info(`Applied ${result.length} migration(s).`);
}

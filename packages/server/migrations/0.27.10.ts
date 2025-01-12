import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.27.10';

/**
 * Summary:
 * - Create the AppReadme table.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Creating the `AppReadme` table');

  await queryInterface.createTable('AppReadme', {
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
    file: { type: DataTypes.BLOB, allowNull: false },
    language: { type: DataTypes.STRING, allowNull: false, defaultValue: 'unspecified' },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'App',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
    deleted: { allowNull: true, type: DataTypes.DATE },
  });
}

/**
 * Summary:
 * - Drop the AppReadme table.
 *
 * @param db The sequelize Database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping the `AppReadme` table');

  await queryInterface.dropTable('AppReadme');
}

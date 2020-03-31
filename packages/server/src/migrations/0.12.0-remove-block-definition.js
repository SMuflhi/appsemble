import { DataTypes } from 'sequelize';

export default {
  key: '0.12.0',

  /**
   * Summary:
   * - Removes BlockDefinition
   * - Adds "OrganizationId" column with a foreign key constraint to BlockVersion and BlockAsset
   * - Adds "description" to BlockVersion
   * - Changes PK of BlockVersion to be [name, version, OrganizationId]
   * - Removes FK checks on OrganizationBlockStyle and AppBlockStyle
   * - Renames "BlockDefinitionId" in OrganizationBlockStyle and AppBlockStyle to "block"
   * - Removes the paranoid "deleted" column in BlockVersion
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    const blockNames = await db.query('SELECT DISTINCT name FROM "BlockVersion"', {
      raw: true,
      type: db.QueryTypes.SELECT,
    });

    const blocks = blockNames.map(({ name: blockName }) => {
      const [organization, name] = blockName.split('/');
      return { organization: organization.slice(1), name };
    });

    await queryInterface.addColumn('BlockVersion', 'OrganizationId', {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Organization',
        key: 'id',
      },
    });

    await queryInterface.removeColumn('BlockVersion', 'deleted');

    await queryInterface.addColumn('BlockAsset', 'OrganizationId', {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Organization',
        key: 'id',
      },
    });

    // Remove foreign key and primary key constraints
    await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_name_fkey');
    await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_pkey');
    await queryInterface.removeConstraint('AppBlockStyle', 'AppBlockStyle_BlockDefinitionId_fkey');
    await queryInterface.removeConstraint(
      'OrganizationBlockStyle',
      'OrganizationBlockStyle_BlockDefinitionId_fkey',
    );

    // Update values of "OrganizationId" and "name"
    await Promise.all(
      blocks.map(async ({ name, organization }) => {
        await db.query(
          'UPDATE "BlockVersion" SET "OrganizationId" = ?, "name" = ? WHERE name = ?',
          {
            replacements: [organization, name, `@${organization}/${name}`],
            type: db.QueryTypes.UPDATE,
          },
        );
        return db.query('UPDATE "BlockAsset" SET "OrganizationId" = ?, "name" = ? WHERE name = ?', {
          replacements: [organization, name, `@${organization}/${name}`],
          type: db.QueryTypes.UPDATE,
        });
      }),
    );

    // Set allowNull to false now that we’ve migrated them.
    await queryInterface.changeColumn('BlockVersion', 'OrganizationId', {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Organization',
        key: 'id',
      },
    });

    await queryInterface.changeColumn('BlockAsset', 'OrganizationId', {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Organization',
        key: 'id',
      },
    });

    // The combination of block name, version, and organization should be unique.
    await queryInterface.addConstraint('BlockVersion', ['name', 'version', 'OrganizationId'], {
      type: 'primary key',
      name: 'BlockVersion_pkey',
    });

    // Blocks prior to this version did not have descriptions, no need to migrate them.
    await queryInterface.addColumn('BlockVersion', 'description', {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    await queryInterface.renameColumn('AppBlockStyle', 'BlockDefinitionId', 'block');
    await queryInterface.renameColumn('OrganizationBlockStyle', 'BlockDefinitionId', 'block');

    await queryInterface.dropTable('BlockDefinition');
  },

  async down() {
    throw new AppsembleError('Due to complexity, down migrations from 0.12.0 are not supported.')
  },
};

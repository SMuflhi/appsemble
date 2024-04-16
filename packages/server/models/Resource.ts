import { logger } from '@appsemble/node-utils';
import { type Resource as ResourceType } from '@appsemble/types';
import { type FindOptions } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BeforeBulkDestroy,
  BeforeDestroy,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppMember, Asset, ResourceSubscription, ResourceVersion } from './index.js';

interface ResourceToJsonOptions {
  /**
   * Properties to exclude from the result.
   *
   * @default ['$clonable', '$seed']
   */
  exclude?: string[];

  /**
   * If specified, only include these properties.
   */
  include?: string[];
}

@Table({ tableName: 'Resource' })
export class Resource extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  data: any;

  /**
   * If true, the resource will be transferred when cloning an app
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  clonable: boolean;

  /**
   * If true, the resource will be used for creating ephemeral resources in demo apps
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  seed: boolean;

  /**
   * If true, the resource is cleaned up regularly
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  ephemeral: boolean;

  @Column(DataType.DATE)
  expires: Date;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AuthorId: string;

  @BelongsTo(() => AppMember, 'AuthorId')
  Author: Awaited<AppMember>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  EditorId: string;

  @BelongsTo(() => AppMember, 'EditorId')
  Editor: Awaited<AppMember>;

  @HasMany(() => Asset)
  Assets: Asset[];

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];

  @HasMany(() => ResourceVersion, { onDelete: 'CASCADE' })
  ResourceVersions: ResourceVersion[];

  @BeforeDestroy
  static async beforeDestroyHook(instance: Resource): Promise<void> {
    const app = await App.findOne({
      attributes: ['definition'],
      include: [
        {
          model: Resource,
          attributes: ['id', 'type'],
          where: {
            id: instance.id,
          },
          required: true,
        },
        {
          model: AppMember,
          attributes: ['id', 'properties'],
        },
      ],
    });

    if (!app) {
      return;
    }

    const resource = app.Resources[0];

    const appMembersToUpdate: Record<string, Record<string, number[] | number>> = {};

    const userPropertiesDefinition = app.definition.users?.properties;

    if (!userPropertiesDefinition) {
      return;
    }

    for (const appMember of app.AppMembers) {
      if (!appMembersToUpdate[appMember.id]) {
        appMembersToUpdate[appMember.id] = {
          ...appMember.properties,
        };
      }

      const referencedProperties = Object.entries(userPropertiesDefinition).filter(
        ([, pd]) => pd.reference?.resource === resource.type,
      );

      for (const [propertyName, propertyDefinition] of referencedProperties) {
        let updatedValue;
        if (propertyDefinition.schema.type === 'integer') {
          updatedValue = 0;
        }

        if (propertyDefinition.schema.type === 'array') {
          updatedValue = appMember.properties[propertyName].filter(
            (entry: number) => entry !== resource.id,
          );
        }

        appMembersToUpdate[appMember.id] = {
          ...appMembersToUpdate[appMember.id],
          [propertyName]: updatedValue,
        };
      }
    }

    logger.info(`Updating user properties for ${resource.type} resource ${resource.id}.`);

    for (const [appMemberId, properties] of Object.entries(appMembersToUpdate)) {
      await AppMember.update(
        {
          properties,
        },
        {
          where: {
            id: appMemberId,
          },
        },
      );
    }

    logger.info(
      `Updated ${Object.keys(appMembersToUpdate).length} users' properties for ${
        resource.type
      } resource ${resource.id}.`,
    );
  }

  @BeforeBulkDestroy
  static async beforeBulkDestroyHook(options: FindOptions): Promise<void> {
    const app = await App.findOne({
      attributes: ['definition'],
      include: [
        {
          model: Resource,
          attributes: ['id', 'type'],
          required: true,
          where: {
            ...options.where,
          },
        },
        {
          model: AppMember,
          attributes: ['id', 'properties'],
        },
      ],
    });

    if (!app) {
      return;
    }

    const appMembersToUpdate: Record<string, Record<string, number[] | number>> = {};

    const userPropertiesDefinition = app.definition.users?.properties;

    if (!userPropertiesDefinition) {
      return;
    }

    for (const appMember of app.AppMembers) {
      if (!appMembersToUpdate[appMember.id]) {
        appMembersToUpdate[appMember.id] = appMember.properties;
      }

      for (const [propertyName, propertyDefinition] of Object.entries(userPropertiesDefinition)) {
        if (!propertyDefinition.reference) {
          return;
        }

        let updatedValue;

        if (propertyDefinition.schema.type === 'integer') {
          updatedValue = 0;
        }

        if (propertyDefinition.schema.type === 'array') {
          updatedValue = appMember.properties[propertyName].filter(
            (entry: number) =>
              !app.Resources.filter(
                (resource) => resource.type === propertyDefinition.reference.resource,
              )
                .map((resource) => resource.id)
                .includes(entry),
          );
        }

        appMembersToUpdate[appMember.id] = {
          ...appMembersToUpdate[appMember.id],
          [propertyName]: updatedValue,
        };
      }
    }

    for (const [appMemberId, properties] of Object.entries(appMembersToUpdate)) {
      await AppMember.update(
        {
          properties,
        },
        {
          where: {
            id: appMemberId,
          },
        },
      );
    }

    logger.info(`Updated ${Object.keys(appMembersToUpdate).length} users' properties.`);
  }

  /**
   * Represent a resource as JSON output
   *
   * @param options Serialization options.
   * @returns A JSON representation of the resource.
   */
  toJSON({ exclude = ['$clonable', '$seed'], include }: ResourceToJsonOptions = {}): ResourceType {
    const result: ResourceType = {
      ...this.data,
      id: this.id,
      $created: this.created.toJSON(),
      $updated: this.updated.toJSON(),
    };

    if (this.Author) {
      result.$author = { id: this.Author.id, name: this.Author.name };
    }

    if (this.Editor) {
      result.$editor = { id: this.Editor.id, name: this.Editor.name };
    }

    if (this.clonable != null) {
      result.$clonable = this.clonable;
    }

    if (this.seed != null) {
      result.$seed = this.seed;
    }

    if (this.ephemeral) {
      result.$ephemeral = this.ephemeral;
    }

    if (this.expires) {
      result.$expires = this.expires.toJSON();
    }

    if (include) {
      for (const name of Object.keys(result)) {
        if (!include.includes(name)) {
          delete result[name];
        }
      }
    }
    if (exclude) {
      for (const name of exclude) {
        delete result[name];
      }
    }
    return result;
  }
}

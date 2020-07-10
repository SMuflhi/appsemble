import type { AppOAuth2Secret as Interface, Remapper } from '@appsemble/types';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from '.';

@Table({ tableName: 'AppOAuth2Secret' })
export default class AppOAuth2Secret extends Model<AppOAuth2Secret> implements Interface {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  authorizationUrl: string;

  @AllowNull(false)
  @Column
  tokenUrl: string;

  @Column
  userInfoUrl: string;

  @Column(DataType.JSON)
  remapper: Remapper;

  @AllowNull(false)
  @Column
  clientId: string;

  @AllowNull(false)
  @Column
  clientSecret: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  icon: IconName;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column
  scope: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  /**
   * The id of the app this secret is linked to.
   */
  @ForeignKey(() => App)
  @AllowNull(false)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;
}
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppOAuth2Authorization, AppSamlAuthorization, User } from '.';

@Table({ tableName: 'AppMember' })
export class AppMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column
  role: string;

  @Column
  email: string;

  @Default(false)
  @Column
  emailVerified: boolean;

  @Column
  name: string;

  @AllowNull(true)
  @Column
  consent: Date;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Unique('UniqueAppMemberIndex')
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @ForeignKey(() => User)
  @Unique('UniqueAppMemberIndex')
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;

  @HasMany(() => AppOAuth2Authorization)
  AppOAuth2Authorizations: AppOAuth2Authorization[];

  @HasMany(() => AppSamlAuthorization)
  AppSamlAuthorizations: AppSamlAuthorization[];
}

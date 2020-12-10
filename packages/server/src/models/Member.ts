import { Role, roles } from '@appsemble/utils';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization, User } from '.';

@Table({ tableName: 'Member' })
export class Member extends Model {
  @Default('Member')
  @Column(DataType.ENUM(...Object.keys(roles)))
  role: Role;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Column
  OrganizationId: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column
  UserId: number;

  @BelongsTo(() => Organization)
  Organization: Organization;

  @BelongsTo(() => User)
  User: User;
}

import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

/**
 * Define database metadata.
 */
@Table({ tableName: 'Meta', createdAt: false, updatedAt: false })
export default class Meta extends Model<Meta> {
  /**
   * The current version of the database.
   *
   * This field _**must**_ stay consistent across versions!
   */
  @PrimaryKey
  @Column(DataType.STRING(11))
  version: string;
}

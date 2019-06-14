import { DataTypes } from 'sequelize';

export default sequelize => {
  const Member = sequelize.define(
    'Member',
    {
      verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      key: DataTypes.STRING,
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  Member.associate = ({ Organization, User }) => {
    Member.hasOne(User);
    Member.hasOne(Organization);
  };

  return Member;
};

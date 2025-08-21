'use strict';

module.exports = (sequelize, DataTypes) => {
  const RoomUser = sequelize.define(
    "RoomUser",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      room_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "room_users",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          fields: ['room_id']
        },
        {
          fields: ['user_id']
        }
      ]
    }
  );

  RoomUser.associate = (models) => {
    // RoomUser belongs to Room
    RoomUser.belongsTo(models.Room, {
      foreignKey: "room_id",
      as: "room"
    });

    // RoomUser belongs to User
    RoomUser.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user"
    });
  };

  return RoomUser;
};

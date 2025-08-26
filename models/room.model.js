'use strict';

const { ROOM_TYPE } = require("../constants/room.constant");

module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "Room",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(Object.values(ROOM_TYPE)),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      owner_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      winner_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      max_players: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      current_players: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      pot_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0.00,
      },
      current_pot_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0.00,
      },
      limit_pot_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0.00,
      },
      room_show_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0.00,
      },
      total_collected_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0.00,
      },
      room_status: {
        type: DataTypes.ENUM('waiting', 'running'),
        allowNull: false,
        defaultValue: 'waiting'
      }
    },
    {
      tableName: "rooms",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          fields: ['type']
        },
        {
          fields: ['owner_id']
        }
      ]
    }
  );

  Room.associate = (models) => {
    // Room belongs to User (owner)
    Room.belongsTo(models.User, {
      foreignKey: "owner_id",
      as: "owner"
    });

    // Room belongs to User (winner)
    Room.belongsTo(models.User, {
      foreignKey: "winner_id",
      as: "winner"
    });

    // Room has many RoomUsers (junction table)
    Room.hasMany(models.RoomUser, {
      foreignKey: "room_id",
      as: "roomUsers"
    });

    // Room has many Users through RoomUser (many-to-many)
    Room.belongsToMany(models.User, {
      through: models.RoomUser,
      foreignKey: "room_id",
      otherKey: "user_id",
      as: "players"
    });
  };

  return Room;
};

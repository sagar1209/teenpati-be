'use strict';

module.exports = (sequelize, DataTypes) => {
  const TransactionHistory = sequelize.define(
    "TransactionHistory",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('deposit', 'withdraw'),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      }
    },
    {
      tableName: "transaction_history",
      timestamps: true,
      paranoid: true
    }
  );

  TransactionHistory.associate = (models) => {
    TransactionHistory.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user"
    });
  };

  return TransactionHistory;
};

"use strict";

module.exports = (sequelize, DataTypes) => {
  const PaymentImage = sequelize.define(
    "PaymentImage",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      original_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      updated_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "payment_images",
      timestamps: true,
      paranoid: true,
    }
  );

  return PaymentImage;
};

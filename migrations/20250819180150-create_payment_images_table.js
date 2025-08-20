"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payment_images", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      original_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      updated_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("payment_images");
  },
};

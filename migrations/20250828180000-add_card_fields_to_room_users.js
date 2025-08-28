'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add card fields to room_users table
    await queryInterface.addColumn('room_users', 'cards', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('room_users', 'card_value', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove card fields from room_users table
    await queryInterface.removeColumn('room_users', 'cards');
    await queryInterface.removeColumn('room_users', 'card_value');
  }
};

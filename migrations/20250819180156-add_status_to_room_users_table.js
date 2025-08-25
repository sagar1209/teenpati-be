'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('room_users', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'waiting'
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('room_users', 'status');
  }
};

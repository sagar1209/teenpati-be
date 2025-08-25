'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rooms', 'room_status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'waiting'
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rooms', 'room_status');
  }
};

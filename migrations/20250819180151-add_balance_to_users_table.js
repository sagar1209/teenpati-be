'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'balance', {
      type: Sequelize.DECIMAL,
      allowNull: false,
      defaultValue: 0.00,
      comment: 'User account balance for payments'
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'balance');
  }
};

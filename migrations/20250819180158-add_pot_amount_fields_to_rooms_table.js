'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rooms', 'current_pot_amount', {
      type: Sequelize.DECIMAL,
      allowNull: false,
      defaultValue: 0.00
    });

    await queryInterface.addColumn('rooms', 'limit_pot_amount', {
      type: Sequelize.DECIMAL,
      allowNull: false,
      defaultValue: 0.00
    });

    await queryInterface.addColumn('rooms', 'room_show_amount', {
      type: Sequelize.DECIMAL,
      allowNull: false,
      defaultValue: 0
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rooms', 'current_pot_amount');
    await queryInterface.removeColumn('rooms', 'limit_pot_amount');
    await queryInterface.removeColumn('rooms', 'room_show_amount');
  }
};

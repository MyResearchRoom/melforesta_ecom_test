'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('product_orders', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('product_orders', 'paymentMethod', {
      type: Sequelize.ENUM(
        'debit_card',
        'netbanking',
        'upi',
        'cod'
      ),
      allowNull: false,
    });
  },
};
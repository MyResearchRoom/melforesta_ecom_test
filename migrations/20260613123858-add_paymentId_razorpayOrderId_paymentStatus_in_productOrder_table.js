'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('product_orders', 'paymentId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'totalAmount',
    });

    await queryInterface.addColumn('product_orders', 'razorpayOrderId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'paymentId',
    });

    await queryInterface.addColumn('product_orders', 'paymentStatus', {
      type: Sequelize.ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
      ),
      allowNull: true,
      after: 'razorpayOrderId',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'product_orders',
      'paymentId'
    );

    await queryInterface.removeColumn(
      'product_orders',
      'razorpayOrderId'
    );

    await queryInterface.removeColumn(
      'product_orders',
      'paymentStatus'
    );
  }
};

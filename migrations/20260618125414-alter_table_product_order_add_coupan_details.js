'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('product_orders', 'couponId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'paymentStatus',
      references: {
          model: "coupons",
          key: "id",
        },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    await queryInterface.addColumn('product_orders', 'couponCode', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'couponId',
    });

    await queryInterface.addColumn('product_orders', 'couponAmount', {
      type: Sequelize.DECIMAL(10,2),
      allowNull: true,
      after: 'couponId',
      defaultValue: 0,
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'product_orders',
      'couponId'
    );

    await queryInterface.removeColumn(
      'product_orders', 
      'couponCode'
    );

    await queryInterface.removeColumn(
      'product_orders',
      'couponAmount'
    );
  }
};

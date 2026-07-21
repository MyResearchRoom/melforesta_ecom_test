'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      'order_shipment_details',
      'deliveryType',
      {
        type: Sequelize.ENUM("courier", "manual"),
        allowNull: true,
        after: "orderId",
      }
    );

    await queryInterface.addColumn(
      'order_shipment_details',
      'deliveryPersonName',
      {
        type: Sequelize.STRING,
        allowNull: true,
        after: "trackingId",
      }
    );

    await queryInterface.addColumn(
      'order_shipment_details',
      'deliveryPersonContact',
      {
        type: Sequelize.STRING,
        allowNull: true,
        after: "deliveryPersonName",
      }
    );

    await queryInterface.changeColumn(
      'order_shipment_details',
      'courierCompanyName',
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );

    await queryInterface.changeColumn(
      'order_shipment_details',
      'trackingId',
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.changeColumn(
      'order_shipment_details',
      'courierCompanyName',
      {
        type: Sequelize.STRING,
        allowNull: false,
      }
    );

    await queryInterface.changeColumn(
      'order_shipment_details',
      'trackingId',
      {
        type: Sequelize.STRING,
        allowNull: false,
      }
    );

    await queryInterface.removeColumn(
      'order_shipment_details',
      'deliveryPersonContact'
    );

    await queryInterface.removeColumn(
      'order_shipment_details',
      'deliveryPersonName'
    );

    await queryInterface.removeColumn(
      'order_shipment_details',
      'deliveryType'
    );

  },
};
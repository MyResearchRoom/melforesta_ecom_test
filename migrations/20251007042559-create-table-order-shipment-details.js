"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_shipment_details", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "product_orders",
          key: "orderId",
        },
        onDelete: "CASCADE",
      },
      courierCompanyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trackingId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pickupDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      estimatedDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      
      // shipmentType: {
      //   type: Sequelize.ENUM("standard", "express", "oneDay"),
      //   allowNull: false,
      // },

      paymentMode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      boxWeight: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      // length: {
      //   type: Sequelize.FLOAT,
      //   allowNull: false,
      // },
      // width: {
      //   type: Sequelize.FLOAT,
      //   allowNull: false,
      // },
      // height: {
      //   type: Sequelize.FLOAT,
      //   allowNull: false,
      // },
      // numberOfBoxes: {
      //   type: Sequelize.INTEGER,
      //   allowNull: false,
      // },
      
      pickupLocation: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("order_shipment_details");
  },
};

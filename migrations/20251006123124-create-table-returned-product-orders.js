"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("returned_product_orders", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'product_orders',
          key: 'orderId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      orderItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "product_order_items",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      returnQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      refundAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false
      },
      returnActionReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      refundStatus: {
        type: Sequelize.ENUM('pending', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },

      pickupPersonId:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      pickupDate:{
        type: Sequelize.DATEONLY,
        allowNull: true
      },

      pickUpTime:{
        type: Sequelize.STRING,
        allowNull: true
      },

      returnStatus:{
        type: Sequelize.ENUM("pending", "accepted", "rejected"),
        defaultValue: "pending",
        allowNull: false
      },

      pickupStatus:{
        type: Sequelize.ENUM("pending", "pickedUp", "completed"),
        defaultValue: "pending",
        allowNull: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("returned_product_orders");
  }
};

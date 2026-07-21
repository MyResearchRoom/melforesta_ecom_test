"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_orders", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      orderId:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
      addressId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "customer_addresses",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      paymentMethod: {
        type: Sequelize.ENUM("debit_card", "netbanking", "upi", "cod"),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("newRequest", "processing", "shipped", "outForDelivery", "delivered", "cancelled"),
        allowNull: false,
        defaultValue: "newRequest"
      },
      totalItems: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subTotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      gstAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      handlingCharges: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_orders");
  }
};

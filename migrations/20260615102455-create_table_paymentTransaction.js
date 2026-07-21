'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'product_orders',
          key: 'orderId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      razorpayOrderId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      razorpayPaymentId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },

      razorpaySignature: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
      },

      paymentStatus: {
        type: Sequelize.ENUM(
          'pending',
          'success',
          'failed',
          'refunded'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },

      failureReason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      refundedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      refundId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(
      'payment_transactions'
    );
  },
};
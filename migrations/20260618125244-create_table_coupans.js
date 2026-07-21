"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("coupons", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      usagePerUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      usedCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      discountType: {
        type: Sequelize.ENUM(
          "percentage",
          "amount"
        ),
        allowNull: false,
      },

      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      applicableType: {
        type: Sequelize.ENUM(
          "all",
          "product",
          "category",
          "variant"
        ),
        allowNull: false,
      },

      minOrderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1,
      },

      maxOrderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      visibility: {
        type: Sequelize.ENUM(
          "private",
          "public"
        ),
        allowNull: false,
        defaultValue: "public",
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupons");
  },
};
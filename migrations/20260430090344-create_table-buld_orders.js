"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bulk_orders", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },

        companyName: {
            type: Sequelize.STRING,
            allowNull: true
        },
        contactName:{
            type: Sequelize.STRING,
            allowNull: false
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false
        },
        phone: {
            type: Sequelize.STRING,
            allowNull: false
        },
        orderType: {
            type: Sequelize.STRING,
            allowNull: false
        },
        quantity:{
            type:Sequelize.DECIMAL(10,2),
            allowNull:false,
        },
        details: {
            type: Sequelize.TEXT,
            allowNull: true
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("bulk_orders");
  },
};

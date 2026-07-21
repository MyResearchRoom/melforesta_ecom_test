"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("return_product_order_medias", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      returnId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "returned_product_orders",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      media: {
        type: Sequelize.BLOB("long"),
        allowNull: false
      },
      mediaContentType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mediaName: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("return_product_order_medias");
  }
};

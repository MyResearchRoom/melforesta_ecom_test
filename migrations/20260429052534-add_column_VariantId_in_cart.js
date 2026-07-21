'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('carts','variantId' , { 
      type: Sequelize.INTEGER,
      allowNull: false,
      after: "productId",
      references: {
          model: 'product_variants', 
          key: 'id',
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('carts','variantId');

  }
};

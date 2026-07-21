'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('pin_codes','deliveryDays' , { 
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "city",
      defaultValue: 2,
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('pin_codes','deliveryDays');

  }
};

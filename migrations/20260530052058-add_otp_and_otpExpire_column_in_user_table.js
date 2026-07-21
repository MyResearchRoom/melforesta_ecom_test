'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users','otp' , { 
      type: Sequelize.STRING,
      allowNull: true,
      after: "isBlock",
    });

    await queryInterface.addColumn('users','otpExpires' , { 
      type: Sequelize.DATE,
      allowNull: true,
      after: "otp",
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users','otp');

    await queryInterface.removeColumn('users','otpExpires');

  }
};

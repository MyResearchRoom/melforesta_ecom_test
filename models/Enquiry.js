"use strict";

module.exports = (sequelize, DataTypes) => {
    const Enquiry = sequelize.define("Enquiry", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mobileNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
        {
            tableName: "enquiries",
            timestamps: true
        }
    );

    return Enquiry;
};
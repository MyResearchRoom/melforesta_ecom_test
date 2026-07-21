"use strict";

module.exports = (sequelize, DataTypes) => {
    const CustomerAddresses = sequelize.define("CustomerAddresses", {
        flatNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        buildingBlock: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        floor: {
            type: DataTypes.STRING,
            allowNull: true
        },
        buildingName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        streetName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        landmark: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        pincode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
        {
            tableName: "customer_addresses",
            timeStamps: true
        }
    );

    CustomerAddresses.associate = (models) => {
        CustomerAddresses.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
            onDelete: "CASCADE",
        });
    };

    return CustomerAddresses;
};

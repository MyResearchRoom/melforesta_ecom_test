"use strict";

module.exports = (sequelize, DataTypes) => {
    const BulkOrder = sequelize.define("BulkOrder", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        contactName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        orderType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false,
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
        {
            tableName: "bulk_orders",
            timestamps: true
        }
    );

    return BulkOrder;
};
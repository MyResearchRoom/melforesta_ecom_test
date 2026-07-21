"use strict";

module.exports = (sequelize, DataTypes) => {
    const ReturnedProductOrder = sequelize.define(
        "ReturnedProductOrder",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            orderId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            orderItemId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            returnQuantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            refundAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            reason: {
                type: DataTypes.STRING,
                allowNull: false
            },
            refundStatus: {
                type: DataTypes.ENUM("pending", "refunded"),
                allowNull: false,
                defaultValue: "pending"
            },
            returnActionReason: {
                type: DataTypes.STRING,
                allowNull: true
            },
            pickupPersonId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            pickupDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            pickUpTime: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            returnStatus: {
                type: DataTypes.ENUM("pending", "accepted", "rejected"),
                allowNull: false,
                defaultValue: "pending"
            },
            pickupStatus: {
                type: DataTypes.ENUM("pending", "pickedUp", "completed"),
                allowNull: false,
                defaultValue: "pending"
            },
            
        },
        {
            tableName: "returned_product_orders",
            timestamps: true
        }
    );

    ReturnedProductOrder.associate = (models) => {
        ReturnedProductOrder.belongsTo(models.ProductOrderItem, {
            foreignKey: "orderItemId",
            as: "orderItem"
        });

        ReturnedProductOrder.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user"
        });

        ReturnedProductOrder.belongsTo(models.ProductOrder, {
            foreignKey: "orderId",
            targetKey: "orderId",
            as: "order"
        });

        ReturnedProductOrder.hasMany(models.ReturnProductOrderMedia, {
            foreignKey: "returnId",
            as: "images"
        });
    };

    return ReturnedProductOrder;
};

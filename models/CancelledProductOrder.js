"use strict";

module.exports = (sequelize, DataTypes) => {
    const CancelledProductOrder = sequelize.define(
        "CancelledProductOrder",
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
            reason: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            refundAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM("pending", "refunded"),
                allowNull: false,
                defaultValue: "pending"
            }
        },
        {
            tableName: "cancelled_product_orders",
            timestamps: true
        }
    );

    CancelledProductOrder.associate = (models) => {
        CancelledProductOrder.belongsTo(models.ProductOrderItem, {
            foreignKey: "orderItemId",
            as: "orderItem"
        });

        CancelledProductOrder.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user"
        });

        CancelledProductOrder.belongsTo(models.ProductOrder, {
            foreignKey: "orderId",
            targetKey: "orderId",
            as: "order"
        });
    };

    return CancelledProductOrder;
};

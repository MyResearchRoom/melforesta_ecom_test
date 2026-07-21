"use strict";

module.exports = (sequelize, DataTypes) => {
    const ProductOrderItem = sequelize.define(
        "ProductOrderItem",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            orderId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            variantId:{
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            discount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            totalPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            }
        },
        {
            tableName: "product_order_items",
            timestamps: true
        }
    );

    ProductOrderItem.associate = (models) => {
        ProductOrderItem.belongsTo(models.ProductOrder, {
            foreignKey: "orderId",
            targetKey: "orderId",
            as: "order"
        });
        ProductOrderItem.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product"
        });
        ProductOrderItem.hasOne(models.CancelledProductOrder, {
            foreignKey: "orderItemId",
            as: "cancelledOrder"
        });
        ProductOrderItem.belongsTo(models.ProductVariant, {
            foreignKey: "variantId",
            as: "variant"
        });
    };

    return ProductOrderItem;
};

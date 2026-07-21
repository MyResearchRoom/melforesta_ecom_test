"use strict"

module.exports = (sequelize, Datatypes) => {
    const ProductReview = sequelize.define(
        "ProductReview", {
        id: {
            type: Datatypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        productId: {
            type: Datatypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: Datatypes.INTEGER,
            allowNull: false,
        },
        rating: {
            type: Datatypes.INTEGER,
            allowNull: false
        },
        review: {
            type: Datatypes.TEXT,
            allowNull: true
        }
    },
        {
            tableName: "product_reviews",
            timestamps: true
        });

    ProductReview.associate = (models) => {
        ProductReview.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user"
        });
        ProductReview.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product"
        });
    };

    return ProductReview;
}
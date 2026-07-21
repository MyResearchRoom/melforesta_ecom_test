"use strict";

module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define(
        "ProductImage",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "products",
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            image: {
                type: DataTypes.BLOB("long"),
                allowNull: false,
            },
            imageContentType: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "product_images",
            timestamps: true,
        }
    );

    ProductImage.associate = (models) => {
        ProductImage.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product",
        });
    };

    return ProductImage;
};

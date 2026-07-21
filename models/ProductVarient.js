"use strict";

module.exports = (sequelize, DataTypes) => {
    const ProductVariant = sequelize.define(
        "ProductVariant",
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

            weight:{
                type: DataTypes.STRING,
                allowNull: false,
            },

            price:{
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },

            discountPercent: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            
            discountedPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            }, 

            currentAvailableStock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            
            totalStock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "product_variants",
            timestamps: true,
        }
    );

    ProductVariant.associate = (models) => {
        ProductVariant.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product",
        });

        ProductVariant.hasMany(models.ProductStock, {
            foreignKey: "productVariant",
            as: "varientStock",
        });

         ProductVariant.hasMany(models.Cart, {
            foreignKey: "variantId",
            as: "cartVarient",
        });
    };

    return ProductVariant;
};

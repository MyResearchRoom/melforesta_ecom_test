"use-strict";

module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define("Product",
        {
            productName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "categories",
                    key: "id",
                },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            gstPercent: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            handlingCharges: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
            },
            isBlock: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            specifications: {
                type: DataTypes.JSON,
                allowNull: true
            },
            
        },
        {
            tableName: "products"
        }
    );

    Product.associate = (models) => {
        Product.belongsTo(models.Category, {
            foreignKey: "categoryId",
            as: "category",
        });

        Product.hasMany(models.ProductVariant, {
            foreignKey: "productId",
            as: "variants",
        });

        Product.hasMany(models.ProductImage, {
            foreignKey: "productId",
            as: "images",
        });

        Product.hasMany(models.ProductReview, {
            foreignKey: "productId",
            as: "reviews",
        });

        Product.hasMany(models.ProductStock, {
            foreignKey: "productId",
            as: "stocks",
            onDelete: "CASCADE",
        });
    };

    return Product;
};

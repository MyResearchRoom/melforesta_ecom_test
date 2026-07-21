"use strict";

module.exports = (sequelize, DataTypes) => {
    const ProductStock = sequelize.define("ProductStock",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            stockId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "categories",
                    zkey: "id"
                },
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "products",
                    key: "id"
                },
            },
            supplierName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            // currentStock: {
            //     type: DataTypes.INTEGER,
            //     allowNull: false,
            //     defaultValue: 0,
            // },
            lowStockThreshold: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue:0,
            },
            restockQuantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            productVariant:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "product_variants",
                    key: "id"
                },
            },
            pricePerUnit: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },
            totalPrice: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            restockDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            
        },
        {
            tableName: "product_stocks",
            hooks: {
                beforeCreate: async (stock) => {
                    const lastStock = await ProductStock.findOne({
                        order: [["createdAt", "DESC"]],
                    });

                    let nextNumber = 1;
                    if (lastStock && lastStock.stockId) {
                        const match = lastStock.stockId.match(/\d+$/);
                        if (match) {
                            nextNumber = parseInt(match[0], 10) + 1;
                        }
                    }

                    stock.stockId = `STK${String(nextNumber).padStart(4, "0")}`;
                },
            },
        }
    );
    ProductStock.associate = (models) => {
        ProductStock.belongsTo(models.Category, {
            foreignKey: "categoryId",
            as: 'category'
        });
        ProductStock.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product"
        });
        ProductStock.belongsTo(models.ProductVariant, {
            foreignKey: "productVariant",
            as: "varient"
        });
        ProductStock.hasMany(models.ProductStockDocument, {
            foreignKey: "stockId",
            as: "documents",
        });
    };

    return ProductStock;
}
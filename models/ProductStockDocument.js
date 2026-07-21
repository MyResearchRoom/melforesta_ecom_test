"use strict"

module.exports = (sequelize, DataTypes) => {
    const ProductStockDocument = sequelize.define("ProductStockDocument", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        stockId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "product_stocks",
                key: "id"
            },
        },
        documentName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        document: {
            type: DataTypes.BLOB("long"),
            allowNull: false
        },     
        documentContentType: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
        {
            tableName: "product_stock_documents",
            timestamps: true,
        },
    );
    ProductStockDocument.associate = (models) => {
        ProductStockDocument.belongsTo(models.ProductStock, {
            foreignKey: "stockId",
            as: "stocks",
        });
    };
    return ProductStockDocument;
}
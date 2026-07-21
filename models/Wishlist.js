"use strict"

module.exports = (sequelize, DataTypes) => {
    const Wishlist = sequelize.define("Wishlist", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id"
            },
            onDelete: "CASCADE",
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Products",
                key: "id",
            },
            onDelete: "CASCADE",
        },
    },
        {
            tableName: "wishlists",
            timeStamps: true,
        });

    Wishlist.associate = (models) => {
        Wishlist.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
        });
        Wishlist.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product",
        });
        Wishlist.belongsTo(models.ProductImage, {
            foreignKey: "productId",
            as: "images",
        });
    };

    return Wishlist;
}
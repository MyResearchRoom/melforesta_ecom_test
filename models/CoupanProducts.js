"use-strict";

module.exports = (sequelize, DataTypes) => {
    const CouponProduct = sequelize.define("CouponProduct",
        {
            couponId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "coupons",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "products",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
                 
        },
        {
            tableName: "coupon_products",
            timestamps: true,
        }
    );

    CouponProduct.associate = (models) => {

        CouponProduct.belongsTo(models.Coupon, {
            foreignKey: "couponId",
            as: "coupon",
        });

        CouponProduct.belongsTo(models.Product, {
            foreignKey: "productId",
            as: "product",
        });
    };

    return CouponProduct;
};

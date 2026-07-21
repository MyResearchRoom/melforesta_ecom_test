"use-strict";

module.exports = (sequelize, DataTypes) => {
    const CouponVariant = sequelize.define("CouponVariant",
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
            variantId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "product_variants",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
                 
        },
        {
            tableName: "coupon_variants",
            timestamps: true,
        }
    );

    CouponVariant.associate = (models) => {

        CouponVariant.belongsTo(models.Coupon, {
            foreignKey: "couponId",
            as: "coupon",
        });

        CouponVariant.belongsTo(models.ProductVariant, {
            foreignKey: "variantId",
            as: "variant",
        });
    };

    return CouponVariant;
};

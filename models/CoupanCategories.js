"use-strict";

module.exports = (sequelize, DataTypes) => {
    const CouponCategory = sequelize.define("CouponCategory",
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
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "categories",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
                 
        },
        {
            tableName: "coupon_categories",
            timestamps: true,
        }
    );

    CouponCategory.associate = (models) => {

        CouponCategory.belongsTo(models.Coupon, {
            foreignKey: "couponId",
            as: "coupon",
        });

        CouponCategory.belongsTo(models.Category, {
            foreignKey: "categoryId",
            as: "category",
        });
    };

    return CouponCategory;
};

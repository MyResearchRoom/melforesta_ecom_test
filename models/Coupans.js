"use-strict";

module.exports = (sequelize, DataTypes) => {
    const Coupon = sequelize.define("Coupon",
        {
            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            usagePerUser: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            usedCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            discountType :{
                type: DataTypes.ENUM(
                    "percentage",
                    "amount",
                ),
                allowNull: false,
            },
            discountValue: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },

            applicableType :{
                type: DataTypes.ENUM(
                    "all",
                    "product",
                    "category",
                    "variant",
                ),
                allowNull: false,
            },

            minOrderAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 1,
            },
            maxOrderAmount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            startDate :{
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            endDate :{
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            visibility :{
                type: DataTypes.ENUM(
                    "private",
                    "public",
                ),
                allowNull: false,
                defaultValue : "public",
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
                 
        },
        {
            tableName: "coupons",
            timestamps: true,
        }
    );

    Coupon.associate = (models) => {

        Coupon.hasMany(models.CouponProduct, {
            foreignKey: "couponId",
            as: "couponProducts",
        });

        Coupon.hasMany(models.CouponCategory, {
            foreignKey: "couponId",
            as: "couponCategories",
        });

        Coupon.hasMany(models.CouponVariant, {
            foreignKey: "couponId",
            as: "couponVariants",
        });

        Coupon.hasMany(models.CouponUsages, {
            foreignKey: "couponId",
            as: "couponUsages",
        });
    };

    return Coupon;
};

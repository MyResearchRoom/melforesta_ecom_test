"use-strict";

module.exports = (sequelize, DataTypes) => {
    const CouponUsages = sequelize.define("CouponUsages",
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
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
            orderId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "product_orders",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
            discountAmount :{
                type: DataTypes.DECIMAL(10,2),
                allowNull: true,
            },
            usedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            }
                 
        },
        {
            tableName: "coupon_usages",
            timestamps: true,
        }
    );

    CouponUsages.associate = (models) => {

        CouponUsages.belongsTo(models.Coupon, {
            foreignKey: "couponId",
            as: "coupon",
        });
        CouponUsages.belongsTo(models.User, {
            foreignKey: "userId",
            as: "user",
        });
        CouponUsages.belongsTo(models.ProductOrder, {
            foreignKey: "orderId",
            as: "order",
        });
        
    };

    return CouponUsages;
};

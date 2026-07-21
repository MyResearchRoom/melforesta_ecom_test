"use-strict"

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            mobileNumber: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            gender: {
                type: DataTypes.ENUM("male", "female", "other"),
                allowNull: false,
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            role: {
                type: DataTypes.ENUM(
                    "ADMIN",
                    "PRODUCT_MANAGER",
                    "CUSTOMER",
                    "DELIVERY_ASSOCIATE"
                ),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            profile: {
                type: DataTypes.BLOB("long"),
                allowNull: true,
            },
            profileContentType: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            isBlock: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            otp: {
                type: DataTypes.STRING,
                allowNull: true
            },
            otpExpires: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: "users",
        }
    );

    return User;
};

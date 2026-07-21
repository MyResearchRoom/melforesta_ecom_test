"use-strict"

module.exports = (sequelize, DataTypes) => {
    const Pincode = sequelize.define("Pincode",
        {
            pinCode: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            district: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            state: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            city: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            deliveryDays: {
                type:DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 2,
            }
        },
        {
            tableName: "pin_codes"
        }
    );

    Pincode.associate = (models) => {
       
    };

    return Pincode;
}
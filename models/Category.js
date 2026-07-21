"use-strict"

module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define("Category",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            isBlock: {
                type: DataTypes.BOOLEAN,
                allowNull: false
            },
        },
        {
            tableName: "categories"
        }
    );

    Category.associate = (models) => {
        Category.hasMany(models.Product, {
            foreignKey: "categoryId",
            as: "products",
            onDelete: "CASCADE"
        });
    };

    return Category;
}
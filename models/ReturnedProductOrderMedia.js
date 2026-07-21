"use strict";

module.exports = (sequelize, DataTypes) => {
  const ReturnProductOrderMedia = sequelize.define(
    "ReturnProductOrderMedia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      returnId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      media: {
        type: DataTypes.BLOB("long"),
        allowNull: false
      },
      mediaContentType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      mediaName: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "return_product_order_medias",
      timestamps: true
    }
  );

  ReturnProductOrderMedia.associate = (models) => {
    ReturnProductOrderMedia.belongsTo(models.ReturnedProductOrder, {
      foreignKey: "returnId",
      as: "return"
    });
  };

  return ReturnProductOrderMedia;
};

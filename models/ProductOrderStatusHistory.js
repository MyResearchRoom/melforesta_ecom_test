"use strict";

module.exports = (sequelize, DataTypes) => {
  const ProductOrderStatusHistory = sequelize.define(
    "ProductOrderStatusHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("newRequest", "processing", "shipped", "outForDelivery", "delivered", "cancelled"),
        allowNull: false,
      },
      changedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "product_order_status_history",
      timestamps: false,
    }
  );

  ProductOrderStatusHistory.associate = (models) => {
    ProductOrderStatusHistory.belongsTo(models.ProductOrder, {
      foreignKey: "orderId",
      targetKey: "orderId",
      as: "order",
    });
  };

  return ProductOrderStatusHistory;
};

module.exports = (sequelize, DataTypes) => {
  const OrderShipmentDetails = sequelize.define(
    "OrderShipmentDetails",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "product_orders",
          key: "orderId",
        },
        onDelete: "CASCADE",
      },

      deliveryType: {
        type: DataTypes.ENUM("courier", "manual"),
        allowNull: true,
      },

      courierCompanyName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trackingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      deliveryPersonName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryPersonContact: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      pickupDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      estimatedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      
      paymentMode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      
      boxWeight: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      // length: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // width: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // height: {
      //   type: DataTypes.FLOAT,
      //   allowNull: false,
      // },
      // numberOfBoxes: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      // },
      
      pickupLocation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "order_shipment_details",
      timestamps: true,
    }
  );

  OrderShipmentDetails.associate = (models) => {
    OrderShipmentDetails.belongsTo(models.ProductOrder, {
      foreignKey: "orderId",
      as: "order",
    });
  };

  return OrderShipmentDetails;
};

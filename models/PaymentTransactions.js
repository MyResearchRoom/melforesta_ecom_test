module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction =
    sequelize.define(
      'PaymentTransaction',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          autoIncrement: true,
          primaryKey: true,
        },

        orderId: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },

        razorpayOrderId: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },

        razorpayPaymentId: {
          type: DataTypes.STRING(100),
          allowNull: true,
          unique: true,
        },

        razorpaySignature: {
          type: DataTypes.TEXT,
          allowNull: true,
        },

        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },

        currency: {
          type: DataTypes.STRING(10),
          allowNull: false,
          defaultValue: 'INR',
        },

        paymentStatus: {
          type: DataTypes.ENUM(
            'pending',
            'success',
            'failed',
            'refunded'
          ),
          allowNull: false,
          defaultValue: 'pending',
        },

        failureReason: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        paidAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        refundedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        refundId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        tableName: 'payment_transactions',
        timestamps: true,
      }
    );

  PaymentTransaction.associate = (
    models
  ) => {
    PaymentTransaction.belongsTo(
      models.ProductOrder,
      {
        foreignKey: 'orderId',
        targetKey: 'orderId',
        as: 'order',
      }
    );

    PaymentTransaction.belongsTo(
      models.User,
      {
        foreignKey: 'userId',
        as: 'user',
      }
    );
  };

  return PaymentTransaction;
};
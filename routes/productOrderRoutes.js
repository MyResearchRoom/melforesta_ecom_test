const express = require("express");
const ProductOrderController = require("../controllers/ProductOrderController");
const { shipmentValidation, validate } = require("../middlewares/validators");
const authMiddlware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/placeOrder",
    authMiddlware,
    authorize(["CUSTOMER"]),
    ProductOrderController.placeOrder
);

router.get(
    "/getAllOrders",
    authMiddlware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductOrderController.getAllOrders
);

router.get(
    "/getOrderDetails/:orderId",
    authMiddlware,
    authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    ProductOrderController.getOrderDetailsById
);

//get customer's orders
router.get(
    "/getCustomersOrder",
    authMiddlware,
    authorize(["CUSTOMER"]),
    ProductOrderController.getCustomersOrders
);

router.put(
    "/changeOrderStatus/:orderId",
    authMiddlware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    ProductOrderController.changeOrderStatus
);


router.post(
    "/submitShippingDetails/:orderId",
    authMiddlware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    shipmentValidation,
    validate,
    ProductOrderController.submitShippingDetails
);

router.get(
    "/getProductOrderStatusHistory/:orderId",
    authMiddlware,
    authorize(["CUSTOMER"]),
    ProductOrderController.getProductOrderStatusHistory
);

router.put(
    "/cancelOrder/:orderId",
    authMiddlware,
    authorize(["PRODUCT_MANAGER", "CUSTOMER"]),
    ProductOrderController.cancelOrder
);

router.post(
  "/create-order",
  authMiddlware,
  ProductOrderController.createRazorpayOrder
);

router.post(
  "/verify-payment",
  authMiddlware,
  ProductOrderController.verifyPayment
);

router.post(
  "/payment-failed",
  authMiddlware,
  ProductOrderController.paymentFailed
);

router.post(
  "/retry-payment/:orderId",
  authMiddlware,
  ProductOrderController.retryPayment
);

router.get(
  "/payment-history",
  authMiddlware,
  authorize(["ADMIN","PRODUCT_MANAGER"]),
  ProductOrderController.getPaymentTransactions
);


module.exports = router;
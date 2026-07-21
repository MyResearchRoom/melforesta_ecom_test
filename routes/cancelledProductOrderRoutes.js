const express = require("express");
const CancelledProductOrderController = require("../controllers/CancelledProductOrderController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { uploadFiles, upload } = require("../middlewares/upload");
const router = express.Router();

router.post(
    "/cancel/:orderId/:orderItemId",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CancelledProductOrderController.cancelProductOrder
);

router.get(
    "/getCancelledProductOrders",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CancelledProductOrderController.getCancelledProductOrders
);

router.get(
    "/getAllCancelledProductOrders",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    CancelledProductOrderController.getAllCancelledProductOrders
);

router.get(
    "/getCancelledProductOrder/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER",]),
    CancelledProductOrderController.getCancelledProductOrderById
);

router.put(
    "/refundCancelledProductOrder/:id",
    authMiddleware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    CancelledProductOrderController.refundCancelledProductOrder
);

module.exports = router;
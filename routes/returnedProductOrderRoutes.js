const express = require("express");
const ReturnedProductOrderController = require("../controllers/returnedProductOrderController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { uploadFiles } = require("../middlewares/upload");
const router = express.Router();

router.post(
    "/return/:orderId/:orderItemId",
    authMiddleware,
    authorize(["CUSTOMER"]),
    uploadFiles([{ name: "media", maxCount: 3 }]),
    ReturnedProductOrderController.returnProductOrder
);

router.get(
    "/getReturnedProducts",
    authMiddleware,
    authorize(["CUSTOMER"]),
    ReturnedProductOrderController.getReturnedProducts
);

router.get(
    "/getAllReturnedProducts",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ReturnedProductOrderController.getAllReturnedProducts
);

router.get(
    "/getReturnedProductById/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    ReturnedProductOrderController.getReturnedProductById
);

router.put(
    "/assignPickupForReturn/:returnId",
    authMiddleware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    ReturnedProductOrderController.assignPickupForReturn
);

router.put(
    "/updateReturnStatus/:returnId",
    authMiddleware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    ReturnedProductOrderController.updateReturnStatus
);

router.put(
    "/updatePickupStatus/:returnId",
    authMiddleware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    ReturnedProductOrderController.updatePickupStatus
);

router.put(
    "/refundReturnedProductOrder/:returnId",
    authMiddleware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    ReturnedProductOrderController.refundReturnedProductOrder
);

module.exports = router;
const express = require("express");
const ProductStockController = require("../controllers/productStockController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { uploadFiles } = require("../middlewares/upload");
const router = express.Router();

router.post(
    "/addStock",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    uploadFiles([{ name: "documents", maxCount: 5 }]),
    ProductStockController.addStock
);

router.get(
    "/getStockList",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductStockController.getStockList
);

router.get(
    "/getStockDetails/:productId/:variantId",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductStockController.getStockDetailsById
);

router.get("/totalStock/:productId/:variantId",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductStockController.getTotalStockByProduct
);


router.get(
    "/getStockDocuments/:stockId",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductStockController.getStockDocuments
);

router.delete(
    "/deleteStock/:stockId",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductStockController.deleteStock
);

module.exports = router;
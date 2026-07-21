const express = require("express");
const BulkOrderController = require("../controllers/bulkOrderController");
const { bulkOrderValidation, validate } = require("../middlewares/validators");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/createBulkOrder",
    bulkOrderValidation,
    validate,
    BulkOrderController.addBulkOrder
);

router.get(
    "/getBulkOrders",
    authMiddleware,
    authorize(["ADMIN","PRODUCT_MANAGER"]),
    BulkOrderController.getBulkOrders
);

module.exports = router;

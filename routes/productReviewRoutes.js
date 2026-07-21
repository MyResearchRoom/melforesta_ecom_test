const express = require("express");
const ProductReviewController = require("../controllers/productReviewController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/addReview/:orderId/:productId",
    authMiddleware,
    authorize(["CUSTOMER"]),
    ProductReviewController.addReview
);

router.get(
    "/getReviews/:productId",
    // authMiddleware,
    // authorize(["ADMIN", "PRODUCT_MANAGER", "SERVICE_MANAGER", "CUSTOMER"]),
    ProductReviewController.getReviews
);

module.exports = router;
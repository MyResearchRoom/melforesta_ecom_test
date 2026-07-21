const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const CountController = require("../controllers/countController");
const router = express.Router();

router.get(
    "/getCounts",
    // authMiddleware,
    // authorize(["ADMIN", "PRODUCT_MANAGER", "SERVICE_MANAGER", "CUSTOMER"]),
    CountController.getCounts
);

module.exports = router;
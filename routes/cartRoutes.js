const express = require("express");
const CartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/addToCart",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CartController.addToCart
);

router.post(
    "/incrementQuantity",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CartController.incrementQuantity
);

router.post(
    "/decrementQuantity",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CartController.decrementQuantity
);

router.delete(
    "/removeFromCart",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CartController.removeFromCart
);

router.get(
    "/getCartItems",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CartController.getCartItems
);

module.exports = router;
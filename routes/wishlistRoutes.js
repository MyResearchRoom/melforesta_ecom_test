const express = require("express");
const WishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/addToWishlist",
    authMiddleware,
    authorize(["CUSTOMER"]),
    WishlistController.addToWishlist
);

router.post(
    "/removeFromWishlist",
    authMiddleware,
    authorize(["CUSTOMER"]),
    WishlistController.removeFromWishlist
);

router.get(
    "/getWishlistItems",
    authMiddleware,
    authorize(["CUSTOMER"]),
    WishlistController.getWishlistItems
);


module.exports = router;
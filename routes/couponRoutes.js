const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { couponValidation, validate } = require("../middlewares/validators");
const CouponController = require("../controllers/couponController");
const router = express.Router();

router.post(
    "/add-coupon",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    couponValidation,
    validate,
    CouponController.addCoupon
);

router.get(
    "/getDetails/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    CouponController.getCouponById
);

router.patch(
    "/edit-coupon/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    CouponController.editCoupon
);

router.get(
    "/getCoupanlist",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER","CUSTOMER"]),
    CouponController.getAllCoupons
);

router.get(
    "/getValidCoupons",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CouponController.getValidCoupons,
)

router.get(
    "/applyCoupon/:couponCode",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CouponController.applyCoupon,
)

module.exports = router

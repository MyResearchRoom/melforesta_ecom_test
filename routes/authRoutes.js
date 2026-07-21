const express = require("express");
const authController = require("../controllers/authController");
const { userValidation, validate } = require("../middlewares/validators")
const { upload } = require("../middlewares/upload")
const authMiddleware = require("../middlewares/authMiddleware")
const authorize = require("../middlewares/authorize")
const router = express.Router();

router.post(
    "/register",
    upload.single("profile"),
    userValidation,
    validate,
    authController.register
);

router.post(
    "/customer-register",
    userValidation,
    validate,
    authController.customerRegister
);

router.post(
    "/login",
    authController.login
);

router.post(
    "/verifyLoginOtp",
    authController.verifyOtpLogin
);

router.post(
    "/resendOtp",
    authController.resendOtp
);

router.get(
    "/getStaffList",
    authMiddleware,
    authorize(["ADMIN"]),
    authController.getStaffList
);

router.get(
    "/getStaffDetails/:id",
    authMiddleware,
    authorize(["ADMIN", "CUSTOMER", "PRODUCT_MANAGER"]),
    upload.single("profile"),
    authController.getStaffDetailsById
);

router.put(
    "/editStaff/:id",
    authMiddleware,
    authorize(["ADMIN"]),
    upload.single("profile"),
    authController.editStaff
);

router.patch(
    "/blockStaff/:id",
    authMiddleware,
    authorize(["ADMIN"]),
    authController.blockStaff
);

router.put(
    "/changePassword/:id",
    authMiddleware,
    authorize(["ADMIN"]),
    authController.changePassword
);

router.delete(
    "/deleteStaff/:id",
    authMiddleware,
    authorize(["ADMIN"]),
    authController.deleteStaff
);

router.get(
    "/getUser",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER", "SERVICE_MANAGER", "CUSTOMER"]),
    authController.getUser
);

router.put(
    "/updateUser",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER", "SERVICE_MANAGER", "CUSTOMER"]),
    upload.single("profile"),
    authController.updateUser
);

router.get(
    "/getPickupPersons",
    authMiddleware,
    authorize(["PRODUCT_MANAGER","ADMIN"]),
    authController.getPickupPersons
);

//for customers
router.put(
    "/updateMyProfile",
    authMiddleware,
    authorize(["CUSTOMER"]),
    upload.single("profile"),
    authController.updateMyProfile
);

router.put(
    "/customerChangePassword",
    authMiddleware,
    authorize(["CUSTOMER"]),
    authController.customerChangePassword
);

router.post(
    "/forgot-password",
    authController.forgotPassword
);

router.post(
    "/reset-password",
    authController.resetPassword
);

module.exports = router;

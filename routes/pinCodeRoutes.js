const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const PincodeController = require("../controllers/pincodeController");

const router = express.Router();

router.post(
    "/createPincode",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    PincodeController.addPincodes
);

router.get(
    "/getPincodelist",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    PincodeController.getPincodeList
);

router.get(
    "/getPincodeDetails/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    PincodeController.getPincodeById
);

router.patch(
    "/editPincode/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    PincodeController.updatePincode
);

router.get(
    "/check-pincode/:pinCode", 
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    PincodeController.checkPincodeExists
);

router.delete(
    "/delete-pincode/:id", 
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    PincodeController.deletePincode
);

router.post(
    "/checkDeliveryAvailability",
    PincodeController.checkDeliveryAvailability
);

module.exports = router


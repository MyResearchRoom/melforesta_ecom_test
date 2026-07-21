const express = require("express");
const CustomeAddressController = require("../controllers/CustomerAddressController")
const { customerAddressValidation, validate } = require("../middlewares/validators");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/addAddress",
    authMiddleware,
    authorize(["CUSTOMER"]),
    customerAddressValidation,
    validate,
    CustomeAddressController.addAddress
);

router.put(
    "/editAddress/:id",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CustomeAddressController.editAddress
);

router.get(
    "/getAddresses",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CustomeAddressController.getAddresses
);

router.get(
    "/getAddress/:id",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CustomeAddressController.getAddressById
);

router.delete(
    "/deleteAddress/:id",
    authMiddleware,
    authorize(["CUSTOMER"]),
    CustomeAddressController.deleteAddress
);

module.exports = router;
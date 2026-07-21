const express = require("express");
const EnquiryController = require("../controllers/enquiryController");
const { enquiryValidation, validate } = require("../middlewares/validators");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const router = express.Router();

router.post(
    "/createEnquiry",
    // authMiddleware,
    // authorize(["CUSTOMER"]),
    enquiryValidation,
    validate,
    EnquiryController.createEnquiry
);

router.get(
    "/getEnquiries",
    authMiddleware,
    authorize(["ADMIN"]),
    EnquiryController.getEnquiries
);

router.delete(
    "/deleteEnquiry/:id",
    authMiddleware,
    authorize(["ADMIN"]),
    EnquiryController.deleteEnquiry
);

module.exports = router;
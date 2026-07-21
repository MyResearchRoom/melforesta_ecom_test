const { check, validationResult } = require("express-validator")

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    next();
};

const userValidation = [
    check("name")
        .notEmpty()
        .withMessage("Name is required")
        .trim()
        .escape(),

    check("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    check("mobileNumber")
        .notEmpty()
        .withMessage("Mobile number is required.")
        .isNumeric()
        .withMessage("Mobile number must contain only numbers.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Mobile number must be 10 digits.")
        .trim(),

    check("gender")
        .notEmpty()
        .withMessage("Gender is required.")
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be 'male', 'female', or 'other'"),

    check("address")
        .optional({ checkFalsy: true })
        .trim()
        .escape(),

    check("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["ADMIN", "PRODUCT_MANAGER", "DELIVERY_ASSOCIATE", "CUSTOMER"])
        .withMessage("Role must be one of 'ADMIN', 'PRODUCT_MANAGER', 'DELIVERY_ASSOCIATE,' ,'CUSTOMER'"),

    check("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[\W_]/)
        .withMessage("Password must contain at least one special character"),
];

const categoryValidation = [
    check("name")
        .notEmpty()
        .withMessage("Category name is required..")
        .trim()
        .escape(),
];

const productValidation = [
    check("productName")
        .notEmpty()
        .withMessage("Product name is required")
        .trim()
        .escape(),

    check("categoryId")
        .notEmpty()
        .withMessage("Category ID is required")
        .isInt()
        .withMessage("Category ID must be a number"),

    // check("originalPrice")
    //     .notEmpty()
    //     .withMessage("Original price is required")
    //     .isFloat({ gt: 0 })
    //     .withMessage("Original price must be greater than 0"),

    // check("discountPercent")
    //     .notEmpty()
    //     .withMessage("Discount percent is required")
    //     .isFloat({ min: 0, max: 100 })
    //     .withMessage("Discount percent must be between 0 and 100"),

    check("images")
        .custom((value, { req }) => {
            if (!req.files || !req.files.images || req.files.images.length === 0) {
                throw new Error("At least one product image is required");
            }

            if (req.files.images.length > 5) {
                throw new Error("You can upload a maximum of 5 images only");
            }

            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            req.files.images.forEach(file => {
                if (!allowedTypes.includes(file.mimetype)) {
                    throw new Error("Invalid image format. Only JPEG, JPG, PNG allowed.");
                }

                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    throw new Error("Image size should not exceed 5MB");
                }
            });

            return true;
        }),
];

const serviceValidation = [
    check("serviceName")
        .notEmpty()
        .withMessage("Service name is required")
        .trim()
        .escape(),

    check("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ gt: 0 })
        .withMessage("Price must be greater than 0"),

    check("description")
        .notEmpty()
        .withMessage("Description is required")
        .trim(),

    check("images")
        .custom((value, { req }) => {
            if (!req.files || !req.files.images || req.files.images.length === 0) {
                throw new Error("At least one service image is required");
            }

            if (req.files.images.length > 5) {
                throw new Error("You can upload a maximum of 5 images only");
            }

            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            req.files.images.forEach(file => {
                if (!allowedTypes.includes(file.mimetype)) {
                    throw new Error("Invalid image format. Only JPEG, JPG, PNG allowed.");
                }

                const maxSize = 2 * 1024 * 1024;
                if (file.size > maxSize) {
                    throw new Error("Image size should not exceed 2MB");
                }
            });

            return true;
        }),
];

const customerAddressValidation = [
    check("flatNo")
        .notEmpty()
        .withMessage("Flat number is required")
        .trim()
        .escape(),

    check("buildingName")
        .notEmpty()
        .withMessage("Building name is required")
        .trim()
        .escape(),

    check("city")
        .notEmpty()
        .withMessage("City is required")
        .trim()
        .escape(),

    check("state")
        .notEmpty()
        .withMessage("State is required")
        .trim()
        .escape(),

    check("pincode")
        .notEmpty()
        .withMessage("Pincode is required")
        .isNumeric()
        .withMessage("Pincode must be numeric")
        .isLength({ min: 6, max: 6 })
        .withMessage("Pincode length must be 6")
];

const enquiryValidation = [
    check("name")
        .notEmpty()
        .withMessage("Name is required")
        .trim()
        .escape(),

    check("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    check("mobileNumber")
        .notEmpty()
        .withMessage("Mobile number is required.")
        .isNumeric()
        .withMessage("Mobile number must contain only numbers.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Mobile number must be 10 digits.")
        .trim(),

    check("message")
        .notEmpty()
        .withMessage("Message is required.")
        .isLength({ min: 10 })
        .withMessage("Message must be at least 10 characters long.")
        .trim()
];

const shipmentValidation = [
    check("deliveryType")
        .notEmpty()
        .withMessage("Delivery type is required")
        .isIn(["courier", "manual"])
        .withMessage("Shipment type must be courier or manual"),

    check("courierCompanyName")
        .if((value, { req }) => req.body.deliveryType === "courier")
        .notEmpty()
        .withMessage("Courier company name is required")
        .trim()
        .escape(),

    check("trackingId")
        .if((value, { req }) => req.body.deliveryType === "courier")
        .notEmpty()
        .withMessage("Tracking ID is required")
        .trim()
        .escape(),

    check("deliveryPersonName")
        .if((value, { req }) => req.body.deliveryType === "manual")
        .notEmpty()
        .withMessage("Delivery person name is required")
        .trim()
        .escape(),

    check("deliveryPersonContact")
        .if((value, { req }) => req.body.deliveryType === "manual")
        .notEmpty()
        .withMessage("Delivery person contact is required")
        .isMobilePhone("en-IN")
        .withMessage("Please enter a valid mobile number")
        .escape(),


    check("pickupDate")
        .notEmpty()
        .withMessage("Pickup date is required")
        .isISO8601()
        .withMessage("Pickup date must be a valid date"),

    check("estimatedDeliveryDate")
        .notEmpty()
        .withMessage("Estimated delivery date is required")
        .isISO8601()
        .withMessage("Estimated delivery date must be a valid date"),

   

    // check("paymentMode")
    //     .notEmpty()
    //     .withMessage("Payment mode is required")
    //     .trim()
    //     .escape(),

    check("boxWeight")
        .notEmpty()
        .withMessage("Box weight is required")
        .isFloat({ gt: 0 })
        .withMessage("Box weight must be a positive number"),

    // check("length")
    //     .notEmpty()
    //     .withMessage("Length is required")
    //     .isFloat({ gt: 0 })
    //     .withMessage("Length must be a positive number"),

    // check("width")
    //     .notEmpty()
    //     .withMessage("Width is required")
    //     .isFloat({ gt: 0 })
    //     .withMessage("Width must be a positive number"),

    // check("height")
    //     .notEmpty()
    //     .withMessage("Height is required")
    //     .isFloat({ gt: 0 })
    //     .withMessage("Height must be a positive number"),

    // check("numberOfBoxes")
    //     .notEmpty()
    //     .withMessage("Number of boxes is required")
    //     .isInt({ gt: 0 })
    //     .withMessage("Number of boxes must be a positive integer"),

    check("pickupLocation")
        .notEmpty()
        .withMessage("Pickup location is required")
        .trim()
        .escape(),

    // check("deliveryAddress")
    //     .notEmpty()
    //     .withMessage("Delivery address is required")
    //     .trim()
    //     .escape(),
];

const bulkOrderValidation = [
    check("contactName")
        .notEmpty()
        .withMessage("Contact Person Name is required")
        .trim()
        .escape(),

    check("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    check("phone")
        .notEmpty()
        .withMessage("Mobile number is required.")
        .isNumeric()
        .withMessage("Mobile number must contain only numbers.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Mobile number must be 10 digits.")
        .trim(),
    
    check("orderType")
        .notEmpty()
        .withMessage("Order type is required")
        .trim()
        .escape(),

    check("quantity")
        .notEmpty()
        .withMessage("Quantity is required")
        .trim()
        .escape(),

];

const couponValidation = [
  check("code")
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required"),

  check("name")
    .trim()
    .notEmpty()
    .withMessage("Coupon name is required"),

  check("discountType")
    .notEmpty()
    .withMessage("Discount type is required")
    .isIn(["percentage", "amount"])
    .withMessage("Discount type must be percentage or amount"),

  check("discountValue")
    .notEmpty()
    .withMessage("Discount value is required")
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be greater than 0"),

  check("visibility")
    .notEmpty()
    .withMessage("Visibility is required")
    .isIn(["public", "private",])
    .withMessage("Invalid visibility value"),

  check("applicableType")
    .notEmpty()
    .withMessage("Applicable type is required")
    .isIn(["all", "product", "category", "variant"])
    .withMessage("Invalid applicable type"),


  check("minOrderAmount")
    .optional({ checkFalsy: true })
    .isFloat({ min: 1 })
    .withMessage("Minimum order amount must be greater than or equal to 1"),

  check("maxOrderAmount")
    .optional({ checkFalsy: true })
    .isFloat({ min: 1 })
    .withMessage("Maximum order amount must be greater than or equal to 1"),

  check("usedCount")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Usage limit must be a positive number"),

  check("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isDate()
    .withMessage("Invalid start date"),

  check("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isDate()
    .withMessage("Invalid end date"),

  check("endDate").custom((value, { req }) => {
    if (new Date(value) < new Date(req.body.startDate)) {
      throw new Error("End date must be after start date");
    }
    return true;
  }),

  check("discountValue").custom((value, { req }) => {
    if (
      req.body.discountType === "percentage" &&
      Number(value) > 100
    ) {
      throw new Error("Percentage discount cannot exceed 100");
    }
    return true;
  }),

  check("productIds").custom((value, { req }) => {
    if (
      req.body.applicableType === "product" &&
      (!Array.isArray(value) || value.length === 0)
    ) {
      throw new Error(
        "At least one product is required for product coupon"
      );
    }
    return true;
  }),

  check("categoryIds").custom((value, { req }) => {
    if (
      req.body.applicableType === "category" &&
      (!Array.isArray(value) || value.length === 0)
    ) {
      throw new Error(
        "At least one category is required for category coupon"
      );
    }
    return true;
  }),

  check("variantIds").custom((value, { req }) => {
    if (
      req.body.applicableType === "variant" &&
      (!Array.isArray(value) || value.length === 0)
    ) {
      throw new Error(
        "At least one variant is required for variant coupon"
      );
    }
    return true;
  }),
]

module.exports = {
    validate,
    userValidation,
    categoryValidation,
    productValidation,
    serviceValidation,
    customerAddressValidation,
    enquiryValidation,
    shipmentValidation,
    bulkOrderValidation,
    couponValidation
};
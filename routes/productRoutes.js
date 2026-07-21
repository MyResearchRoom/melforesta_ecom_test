const express = require("express");
const ProductController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { uploadFiles } = require("../middlewares/upload");
const { productValidation, validate } = require("../middlewares/validators");
const router = express.Router();

router.post(
    "/createProduct",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    uploadFiles([{ name: "images", maxCount: 5 }]),
    productValidation,
    validate,
    ProductController.createProduct
);

router.put(
    "/editProduct/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    uploadFiles([{ name: "images", maxCount: 5 }]),
    ProductController.editProduct
);

router.get(
    "/getProductList",
    // authMiddleware,
    // authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    ProductController.getProductList
);

router.get(
    "/getProductDetails/:id",
    // authMiddleware,
    // authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    ProductController.getProductDetails
);

router.get(
    "/getProductByCategory/:categoryId",
    // authMiddleware,
    // authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    ProductController.getProductsByCategory
);

router.patch(
    "/blockProduct/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductController.blockProduct
);

router.delete(
    "/deleteProduct/:id",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER"]),
    ProductController.deleteProduct
);

router.get(
    "/getVarientsByProductId/:productId",
    authMiddleware,
    authorize(["ADMIN", "PRODUCT_MANAGER", "CUSTOMER"]),
    ProductController.getProductVarientByProduct
);

module.exports = router
const { Op, where, Sequelize } = require("sequelize");
const { User, Category, Product, ProductImage, ProductStock, ProductReview,ProductVariant } = require("../models");

const ProductController = {

    async createProduct(req, res) {
        try {
            const {
                productName,
                categoryId,
                description,
                // discountPercent,

                gstPercent,
                handlingCharges = 0,
                specifications = {},
                prices,
            } = req.body;

            // console.log("prices",prices);
            
                 
            const parseField = (value, defaultValue) => {
                if (!value) return defaultValue;

                if (typeof value === "string") {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return defaultValue;
                    }
                }
                return value;
            };

            const parsedPrices = parseField(prices, []);

            if (!parsedPrices.length) {
                return res.status(400).json({
                    success: false,
                    message: "Prices are required"
                });
            }

            for (let p of parsedPrices) {
                if (!p.weight || !p.price) {
                    return res.status(400).json({
                    success: false,
                    message: "Each variant must have weight and price"
                    });
                }
            }

            const product = await Product.create({
                productName,
                categoryId,
                description,
                gstPercent,
                handlingCharges,
                specifications: parseField(specifications, {}),
                // totalStock: 0,
                isBlock: false,
            });


            if (req.files && req.files.images) {
                if (req.files.images.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: "You can upload a maximum of 5 images only",
                    });
                }

                const imagesData = req.files.images.map((file) => ({
                    productId: product.id,
                    image: file.buffer,
                    imageContentType: file.mimetype,
                }));

                if (imagesData.length > 0) {
                    await ProductImage.bulkCreate(imagesData);
                }
            }

            const priceData = parsedPrices.map((price) => ({
                productId: product.id,
                weight: price.weight,
                price: price.price,
                discountPercent: price.discountPercent || 0,
                discountedPrice: (
                    parseFloat(price.price) -
                    (parseFloat(price.price) * parseFloat(price.discountPercent || 0)) / 100
                ).toFixed(2),
            }));

            await ProductVariant.bulkCreate(priceData);

            return res.status(200).json({
                success: true,
                message: "Product created successfully.",
                data: product,
            });
        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to create product",
            });
        }
    },

    async editProduct(req, res) {
        try {
            const {
                productName,
                categoryId,
                description,
                gstPercent,
                handlingCharges = 0,
                 
                specifications = {},
                deletedImageIds = [],
                prices,
            } = req.body;


            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Product ID is required"
                });
            }

            const product = await Product.findByPk(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            const parseField = (value, defaultValue) => {
                if (!value) return defaultValue;

                if (typeof value === "string") {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return defaultValue;
                    }
                }
                return value;
            };

            const parsedPrices = parseField(prices, []);

            if (!parsedPrices.length) {
                return res.status(400).json({
                    success: false,
                    message: "Prices are required"
                });
            }

            for (let p of parsedPrices) {
                if (!p.weight || !p.price) {
                    return res.status(400).json({
                    success: false,
                    message: "Each variant must have weight and price"
                    });
                }
            }

            const updatedGstPercent = gstPercent ?? product.gstPercent;

            await product.update({
                productName,
                categoryId,
                description,
                gstPercent: updatedGstPercent,
                handlingCharges,
                specifications: parseField(specifications, {}),

            });

            const deletedImageIdsData = deletedImageIds
            ? JSON.parse(deletedImageIds)
            : [];

            if(deletedImageIdsData.length > 0){
                await ProductImage.destroy({
                    where: {
                        id: deletedImageIdsData,
                        productId: product.id,
                    },
                });
            }

            if (req.files && req.files.images) {
                if (req.files.images.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: "You can upload a maximum of 5 images only",
                    });
                }

                // await ProductImage.destroy({
                //     where: { productId: product.id },
                // });

                const imagesData = req.files.images.map((file) => ({
                    productId: product.id,
                    image: file.buffer,
                    imageContentType: file.mimetype,
                }));

                if (imagesData.length > 0) {
                    await ProductImage.bulkCreate(imagesData);
                }
            }

            const existing = parsedPrices.filter(p => p.id);
            const newOnes = parsedPrices.filter(p => !p.id);
            console.log("NEW VARIANTS:", newOnes);

            for (let price of existing) {
                const discountedPrice = (
                    parseFloat(price.price) -
                    (parseFloat(price.price) * parseFloat(price.discountPercent || 0)) / 100
                ).toFixed(2);

                await ProductVariant.update(
                    {
                    weight: price.weight,
                    price: price.price,
                    discountPercent: price.discountPercent || 0,
                    discountedPrice,
                    },
                    { where: { id: price.id } }
                );
            }

            // for (let price of newOnes) {
            //     const discountedPrice = (
            //         parseFloat(price.price) -
            //         (parseFloat(price.price) * parseFloat(price.discountPercent || 0)) / 100
            //     ).toFixed(2);

            //     await ProductVariant.create({
            //         productId: product.id,
            //         weight: price.weight,
            //         price: price.price,
            //         discountPercent: price.discountPercent || 0,
            //         discountedPrice,
            //     });
            // }
            const createdIds = [];

            for (let price of newOnes) {
                const discountedPrice = (
                    parseFloat(price.price) -
                    (parseFloat(price.price) * parseFloat(price.discountPercent || 0)) / 100
                ).toFixed(2);

                const created = await ProductVariant.create({
                    productId: product.id,
                    weight: price.weight,
                    price: price.price,
                    discountPercent: price.discountPercent || 0,
                    discountedPrice,
                });

                createdIds.push(created.id);
            }

            const existingDB = await ProductVariant.findAll({
                where: { productId: product.id }
            });

            const dbIds = existingDB.map(v => v.id);
            // const incomingIds = parsedPrices.filter(p => p.id).map(p => p.id);
            const incomingIds = [
                ...parsedPrices.filter(p => p.id).map(p => p.id),
                ...createdIds
            ];

            const toDelete = dbIds.filter(id => !incomingIds.includes(id));

            if (toDelete.length > 0) {
                await ProductVariant.destroy({
                    where: { id: toDelete }
                });
            }

            return res.status(200).json({
                success: true,
                message: "Product updated successfully.",
                data: product,
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to update product",
                error: error.message
            });
        }
    },

    // async getProductList(req, res) {
    //     try {
    //         const { page = 1, limit = 10, search = "",role,categoryId } = req.query;
    //         const offset = (page - 1) * limit;
    //         // const role = req.user.role;
    //         let whereCondition = {};
    //         // console.log("role",role);

    //         // Search
    //         if (search) {
    //             whereCondition[Op.or] = [
    //                 { productName: { [Op.like]: `%${search}%` } },
    //                 { "$category.name$": { [Op.like]: `%${search}%` } },
    //             ];
    //         }
            
    //         if(categoryId){
    //             whereCondition.categoryId=categoryId;
    //         }

    //         // If not admin → show only un-blocked
    //         if (!role || !["ADMIN", "PRODUCT_MANAGER"].includes(role.toUpperCase())) {
    //             whereCondition.isBlock = false;
    //         }

    //         const { rows: products, count: totalRecords } = await Product.findAndCountAll({
    //             where: whereCondition,
    //             attributes: [
    //                 "id",
    //                 "productName",
    //                 "description",
    //                 "gstPercent",
    //                 "handlingCharges",
    //                 // "specifications",
    //                 "categoryId",
    //                 "isBlock",
    //                 "createdAt",
    //             ],
    //             include: [
    //                 {
    //                     model: Category,
    //                     as: "category",
    //                     attributes: ["id", "name"],
    //                     // required: true,
    //                 },
    //                 {
    //                     model: ProductImage,
    //                     as: "images",
    //                     attributes: ["id", "image", "imageContentType"],
    //                 },
    //                 {
    //                     model: ProductVariant,
    //                     as: "variants",
    //                     // required: true,
    //                 },
    //             ],
    //             order: [["createdAt", "DESC"]],
    //             limit: parseInt(limit, 10),
    //             offset: parseInt(offset, 10),
    //             distinct: true
    //         });

    //         // Helper to safely parse JSON or return object
    //         const safeParse = (value) => {
    //             if (!value) return {};
    //             if (typeof value === "object") return value;
    //             try {
    //                 return JSON.parse(value);
    //             } catch {
    //                 return {};
    //             }
    //         };

    //         // Format products
    //         const formattedProducts = products.map(product => {
    //             const productData = product.toJSON();

    //             // Base64 images
    //             const images = productData.images.map(img => ({
    //                 id: img.id,
    //                 image: `data:${img.imageContentType};base64,${img.image.toString("base64")}`
    //             }));

    //             return {
    //                 ...productData,
    //                 // specifications: safeParse(productData.specifications),
    //                 images,
    //             };
    //         });

    //         return res.status(200).json({
    //             success: true,
    //             message: "Product List fetched successfully",
    //             currentPage: parseInt(page, 10),
    //             totalPages: Math.ceil(totalRecords / limit),
    //             totalRecords,
    //             data: formattedProducts
    //         });

    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "Failed to fetch product list",
    //             error: error.message
    //         });
    //     }
    // },

    async getProductList(req, res) {
        try {
            const { page = 1, limit = 20, search = "", role, categoryId, minPrice, maxPrice ,isBlock } = req.query;

            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const offset = (pageNum - 1) * limitNum;

            let whereCondition = {};

            if (search) {
                whereCondition[Op.or] = [
                    { productName: { [Op.like]: `%${search}%` } },
                    { "$category.name$": { [Op.like]: `%${search}%` } },
                ];
            }

            if (categoryId) {
                whereCondition.categoryId = categoryId;
            }

            // if (!role || !["ADMIN", "PRODUCT_MANAGER"].includes(role.toUpperCase())) {
            //     whereCondition.isBlock = false;
            // }

            const isAdmin = role && ["ADMIN", "PRODUCT_MANAGER"].includes(role.toUpperCase());

            const parsedIsBlock =
                isBlock === "true" ? true :
                isBlock === "false" ? false :
                null;

            if (isAdmin) {
                if (parsedIsBlock !== null) {
                    whereCondition.isBlock = parsedIsBlock;
                }
            } else {
                whereCondition.isBlock = false;
            }

            const priceFilter = `
                SELECT pv.productId
                FROM product_variants pv
                WHERE pv.id = (
                    SELECT pv2.id 
                    FROM product_variants pv2
                    WHERE pv2.productId = pv.productId
                    ORDER BY pv2.id ASC
                    LIMIT 1
                )
                ${minPrice ? `AND pv.discountedPrice >= ${Number(minPrice)}` : ""}
                ${maxPrice ? `AND pv.discountedPrice <= ${Number(maxPrice)}` : ""}
            `;

            const { rows: products, count: totalRecords } = await Product.findAndCountAll({
                where: {
                    ...whereCondition,
                    ...(minPrice || maxPrice ? {
                        id: {
                            [Op.in]: Sequelize.literal(`(${priceFilter})`)
                        }
                    } : {})
                },
                attributes: [
                    "id",
                    "productName",
                    "description",
                    "gstPercent",
                    "handlingCharges",
                    "categoryId",
                    "isBlock",
                    "createdAt",
                ],
                include: [
                    {
                        model: Category,
                        as: "category",
                        attributes: ["id", "name"],
                    },
                    {
                        model: ProductImage,
                        as: "images",
                        attributes: ["id", "image", "imageContentType"],
                        limit: 1
                    },
                    {
                        model: ProductVariant,
                        as: "variants",
                        attributes: ["id", "discountedPrice", "weight", "createdAt"],
                        limit: 1,
                        order: [["createdAt", "ASC"]],
                    },
                    
                ],
                order: [["createdAt", "DESC"]],
                limit: limitNum,
                offset: offset,
                distinct: true,
            });

            const formattedProducts = products.map(product => {
                const productData = product.toJSON();

                const images = productData.images.slice(0, 1).map(img => ({
                    id: img.id,
                    image: `data:${img.imageContentType};base64,${img.image.toString("base64")}`
                }));

                return {
                    ...productData,
                    images,
                };
            });

            return res.status(200).json({
                success: true,
                message: "Product List fetched successfully",
                currentPage: pageNum,
                totalPages: Math.ceil(totalRecords / limitNum),
                totalRecords,
                data: formattedProducts
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch product list",
                error: error.message
            });
        }
    },

    async getProductDetails(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Id is required"
                });
            }

            const parseJson = (value) => {
                if (typeof value === "string") {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value;
                    }
                }
                return value;
            };

            const product = await Product.findByPk(id, {
                include: [
                    {
                        model: ProductImage,
                        as: "images",
                        attributes: ["id", "image", "imageContentType"],
                    },
                    {
                        model: Category,
                        as: "category",
                        attributes: ["id", "name"],
                    },
                    {
                        model: ProductVariant,
                        as: "variants",
                    },
                    {
                        model: ProductStock,
                        as: "stocks",
                        attributes: ["id", "lowStockThreshold", "createdAt"],
                        order: [["createdAt", "DESC"]],
                        limit: 1
                    },
                    {
                        model: ProductReview,
                        as: "reviews",
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name"]
                            }
                        ],
                        attributes: ["id", "rating", "review", "createdAt"]
                    }
                ],
            });

            if (!product) {
                console.log(error);
                
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            const productData = product.toJSON();

            productData.images = productData.images.map(img => ({
                id: img.id,
                image: img.image ? `data:${img.imageContentType};base64,${img.image.toString("base64")}` : null,
            }));
            productData.specifications = parseJson(productData.specifications);

            productData.variants = productData.variants.map((variant) => {
                const currentStock = Number(variant.currentAvailableStock || 0);
                const lowStockThreshold = Number(variant.lowStockThreshold || 0);

                let status = "inStock";

                if (currentStock === 0) status = "outOfStock";
                else if (currentStock <= lowStockThreshold) status = "lowStock";

                return {
                    ...variant,
                    stockStatus: status,
                    currentStock,
                };
            });

            if (productData.reviews && productData.reviews.length > 0) {
                const totalRatings = productData.reviews.reduce((sum, review) => sum + review.rating, 0);
                productData.averageRating = parseFloat((totalRatings / productData.reviews.length).toFixed(2));
            } else {
                productData.averageRating = 0;
            }

            return res.status(200).json({
                success: true,
                message: "Product details fetched successfully",
                data: productData,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch product details",
            });
        }
    },

    async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;

            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    message: "Category ID is required"
                });
            }

            const products = await Product.findAll({
                where: { categoryId },
                attributes: ["id", "productName"],
                include: [
                    {
                        model: Category,
                        as: "category",
                        attributes: ["id", "name"]
                    }
                ],
            });

            return res.status(200).json({
                success: true,
                message: "Products fetched successfully",
                data: products
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch products"
            });
        }
    },

    async blockProduct(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const product = await Product.findByPk(id)
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "Product not found"
                });
            }

            product.isBlock = !product.isBlock;
            await product.save();

            return res.status(200).json({
                success: true,
                message: `Product ${product.isBlock ? "blocked" : "unblocked"} successfully`,
                data: {
                    id: product.id,
                    productName: product.productName,
                    isBlock: product.isBlock
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to block/unblock product"
            });
        }
    },

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const product = await Product.findByPk(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            await product.destroy();

            return res.status(200).json({
                success: true,
                message: "Product deleted successfully"
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete product"
            });
        }
    },

    async getProductVarientByProduct(req,res){
        try {
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: "Product ID is required"
                });
            }

            const variants = await ProductVariant.findAll({
                where: { productId },
                attributes: ["id", "productId","weight","price","currentAvailableStock"],
            });

            return res.status(200).json({
                success: true,
                message: "Product varients fetched successfully",
                data: variants
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch product variants"
            });
        }
    }

}

module.exports = ProductController
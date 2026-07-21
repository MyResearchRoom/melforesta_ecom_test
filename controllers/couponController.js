const { Op, where ,fn, col, literal} = require("sequelize")
const { User,CouponCategory,CouponProduct,Coupon,CouponVariant,CouponUsages, Category, Product, ProductOrder,Cart,ProductVariant, sequelize} = require("../models");
const { validateCoupon } = require("../services/couponService");

// async function validateCoupon({
//         userId,
//         couponCode
//     }) 
//     {
//         if (!couponCode) {
//             throw new Error("Coupon code is required");
//         }

//         const coupon = await Coupon.findOne({
//             where: {
//                 code: couponCode.trim(),
//                 isActive: true,
//             },
//         });

//         if (!coupon) {
//             throw new Error("Invalid coupon code");
//         }

//         const now = new Date();

//         if (coupon.startDate && now < coupon.startDate) {
//             throw new Error("Coupon is not active yet");
//         }

//         if (coupon.endDate && now > coupon.endDate) {
//             throw new Error("Coupon has expired");
//         }

//         const usageCount = await CouponUsages.count({
//             where: {
//                 couponId: coupon.id,
//                 userId,
//             },
//         });

//         if (coupon.usagePerUser && usageCount >= coupon.usagePerUser
//             ) {
//             throw new Error("Coupon usage limit exceeded");
//         }

//         const cartItems = await Cart.findAll({
//             where: { userId },
//             include: [
//                 {
//                 model: Product,
//                 as: "product",
//                 attributes: [
//                     "id",
//                     "categoryId",
//                     "productName",
//                 ],
//                 },
//                 {
//                 model: ProductVariant,
//                 as: "variant",
//                 attributes: [
//                     "id",
//                     "price",
//                     "discountedPrice",
//                     "discountPercent",
//                 ],
//                 },
//             ],
//         });

//         if (!cartItems.length) {
//             throw new Error("Cart is empty");
//         }

//         let eligibleItems = [];

//         if (coupon.applicableType === "all") {
//                 eligibleItems = cartItems;
//         }

//         else if (coupon.applicableType === "category") {
//             const mappings = await CouponCategory.findAll({
//                 where: {
//                     couponId: coupon.id,
//                 },
//             });

//             const categoryIds = mappings.map(
//                 (item) => item.categoryId
//             );

//             eligibleItems = cartItems.filter((item) =>
//                 categoryIds.includes(
//                     item.product.categoryId
//                 )
//             );
//         }

//         else if (coupon.applicableType === "product") {
//             const mappings = await CouponProduct.findAll({
//                 where: {
//                     couponId: coupon.id,
//                 },
//             });

//             const productIds = mappings.map(
//                 (item) => item.productId
//             );

//             eligibleItems = cartItems.filter((item) =>
//                 productIds.includes(
//                     item.product.id
//                 )
//             );

//             console.log("eligibleItems",eligibleItems);
            
//         }

//         else if (coupon.applicableType === "variant") {
//             const mappings = await CouponVariant.findAll({
//                 where: {
//                 couponId: coupon.id,
//                 },
//             });

//             const variantIds = mappings.map(
//                 (item) => item.variantId
//             );

//             eligibleItems = cartItems.filter(
//                 (item) =>
//                 item.variant &&
//                 variantIds.includes(
//                     item.variant.id
//                 )
//             );
//         }

//         if (!eligibleItems.length) {
//             throw new Error("Coupon is not applicable to cart items");
//         }

//         const eligibleSubtotal =
//             eligibleItems.reduce((sum, item) => {
//                 const price =
//                 Number(item.variant?.discountedPrice) || 0;
//                 return (
//                 sum +
//                 price * Number(item.quantity)
//                 );
//             }, 0);


//         // console.log("eligibleSubtotal",eligibleSubtotal);
        

//         if (coupon.minOrderAmount && eligibleSubtotal < coupon.minOrderAmount ) {
//             throw new Error(`Minimum purchase amount ₹${coupon.minOrderAmount} required`);
//         }

//         if (coupon.maxOrderAmount && eligibleSubtotal > coupon.maxOrderAmount ) {
//             throw new Error(`Maximum purchase amount ₹${coupon.maxOrderAmount} allowed`);
//         }

//         let discount = 0;

//         if (coupon.discountType ==="percentage") {
//                 discount = (eligibleSubtotal * coupon.discountValue) / 100;
//         } else {
//                 discount =Number(coupon.discountValue) || 0;
//                 if (
//                     discount >
//                     eligibleSubtotal
//                 ) {
//                     discount =
//                     eligibleSubtotal;
//                 }
//         }
//         // console.log("discount",discount);


//         return {
//             coupon,
//             discount,
//             eligibleSubtotal
//         };
// };

const CouponController = {
    async addCoupon(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {code, name, description, usedCount, discountType, discountValue, applicableType, minOrderAmount, maxOrderAmount, visibility,startDate, endDate,isActive, productIds = [], categoryIds = [], variantIds = [],} = req.body;

            const existingCoupon = await Coupon.findOne({
                where: { code },
                transaction,
            });

            if (existingCoupon) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Coupon code already exists",
                });
            }

            const coupon = await Coupon.create(
            {
                code,
                name,
                description,
                usedCount,
                discountType,
                discountValue,
                applicableType,
                minOrderAmount,
                maxOrderAmount,
                startDate,
                endDate,
                visibility,
                isActive
            },
            { transaction }
            );

            if (applicableType === "product") {
                if (!productIds.length) {
                    await transaction.rollback();

                    return res.status(400).json({
                    success: false,
                    message: "Please provide productIds",
                    });
                }

                const uniqueProductIds = [...new Set(productIds)];

                const productCount = await Product.count({
                    where: {
                        id: uniqueProductIds,
                    },
                    transaction,
                });

                if (productCount !== uniqueProductIds.length) {
                    throw new Error("One or more products do not exist");
                }

                const mappings = uniqueProductIds.map((productId) => ({
                    couponId: coupon.id,
                    productId,
                }));

                await CouponProduct.bulkCreate(mappings, { transaction });
            }

            if (applicableType === "category") {
                if (!categoryIds.length) {
                    await transaction.rollback();

                    return res.status(400).json({
                    success: false,
                    message: "Please provide categoryIds",
                    });
                }

                const uniqueCategoryIds = [...new Set(categoryIds)];

                const categoryCount = await Category.count({
                    where: {
                        id: uniqueCategoryIds,
                    },
                    transaction,
                });

                if (categoryCount !== uniqueCategoryIds.length) {
                    throw new Error("One or more categories do not exist");
                }

                const mappings = uniqueCategoryIds.map((categoryId) => ({
                    couponId: coupon.id,
                    categoryId,
                }));

                await CouponCategory.bulkCreate(mappings, { transaction });
            }

            if (applicableType === "variant") {
                if (!variantIds.length) {
                    await transaction.rollback();

                    return res.status(400).json({
                    success: false,
                    message: "Please provide variantIds",
                    });
                }
                const uniqueVariantIds = [...new Set(variantIds)];

                const variantCount = await ProductVariant.count({
                    where: {
                        id: uniqueVariantIds,
                    },
                    transaction,
                });

                if (variantCount !== uniqueVariantIds.length) {
                    throw new Error("One or more variants do not exist");
                }

                const mappings = uniqueVariantIds.map((variantId) => ({
                    couponId: coupon.id,
                    variantId,
                }));

                await CouponVariant.bulkCreate(mappings, { transaction });
            }

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: "Coupon created successfully",
                data: coupon,
            });
        } catch (error) { 
            await transaction.rollback();

            console.error(error);           
            return res.status(500).json({
                success: false,
                message: "Failed to add coupon"
            });
        }

    },

    async getCouponById(req, res) {
        try {
            const { id } = req.params;

            const coupon = await Coupon.findByPk(id, {
                include: [
                    {
                        model: CouponProduct,
                        as: "couponProducts",
                        attributes: ["productId"],
                    },
                    {
                        model: CouponCategory,
                        as: "couponCategories",
                        attributes: ["categoryId"],
                    },
                    {
                        model: CouponVariant,
                        as: "couponVariants",
                        attributes: ["variantId"],
                    },
                ],
            });

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: "Coupon not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    ...coupon.toJSON(),

                    productIds: coupon.couponProducts.map(
                        item => item.productId
                    ),

                    categoryIds: coupon.couponCategories.map(
                        item => item.categoryId
                    ),

                    variantIds: coupon.couponVariants.map(
                        item => item.variantId
                    ),
                },
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch coupon details",
            });
        }
    },

    async editCoupon(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;

            const {
                code,
                name,
                description,
                usedCount,
                discountType,
                discountValue,
                applicableType,
                minOrderAmount,
                maxOrderAmount,
                visibility,
                startDate,
                endDate,
                isActive,
                productIds = [],
                categoryIds = [],
                variantIds = [],
            } = req.body;

            const coupon = await Coupon.findByPk(id, {
                transaction,
            });

            if (!coupon) {
                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Coupon not found",
                });
            }

            const existingCoupon = await Coupon.findOne({
                where: {
                    code,
                    id: {
                        [Op.ne]: id,
                    },
                },
                transaction,
            });

            if (existingCoupon) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Coupon code already exists",
                });
            }

            await coupon.update(
                {
                    code,
                    name,
                    description,
                    usedCount,
                    discountType,
                    discountValue,
                    applicableType,
                    minOrderAmount,
                    maxOrderAmount,
                    visibility,
                    startDate,
                    endDate,
                    isActive,
                },
                { transaction }
            );

            await CouponProduct.destroy({
                where: { couponId: id },
                transaction,
            });

            await CouponCategory.destroy({
                where: { couponId: id },
                transaction,
            });

            await CouponVariant.destroy({
                where: { couponId: id },
                transaction,
            });

            if (applicableType === "product") {
                const uniqueProductIds = [...new Set(productIds)];

                const productCount = await Product.count({
                    where: {
                        id: uniqueProductIds,
                    },
                    transaction,
                });

                if (productCount !== uniqueProductIds.length) {
                    throw new Error("One or more products do not exist");
                }

                await CouponProduct.bulkCreate(
                    uniqueProductIds.map((productId) => ({
                        couponId: id,
                        productId,
                    })),
                    { transaction }
                );
            }

            if (applicableType === "category") {
                const uniqueCategoryIds = [...new Set(categoryIds)];

                const categoryCount = await Category.count({
                    where: {
                        id: uniqueCategoryIds,
                    },
                    transaction,
                });

                if (categoryCount !== uniqueCategoryIds.length) {
                    throw new Error("One or more categories do not exist");
                }

                await CouponCategory.bulkCreate(
                    uniqueCategoryIds.map((categoryId) => ({
                        couponId: id,
                        categoryId,
                    })),
                    { transaction }
                );
            }

            if (applicableType === "variant") {
                const uniqueVariantIds = [...new Set(variantIds)];

                const variantCount = await ProductVariant.count({
                    where: {
                        id: uniqueVariantIds,
                    },
                    transaction,
                });

                if (variantCount !== uniqueVariantIds.length) {
                    throw new Error("One or more variants do not exist");
                }

                await CouponVariant.bulkCreate(
                    uniqueVariantIds.map((variantId) => ({
                        couponId: id,
                        variantId,
                    })),
                    { transaction }
                );
            }

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: "Coupon updated successfully",
            });

        } catch (error) {
            await transaction.rollback();

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message || "Failed to update coupon",
            });
        }
    },

    async getAllCoupons(req, res) {
        try {
            const { page = 1, limit = 10, search = "" ,isActive, visibility, applicableType} = req.query;
            const {role} = req.user;

            const parsedPage = parseInt(page, 10);
            const isAll = limit === "all";
            const parsedLimit = isAll ? null : parseInt(limit, 10);
            const offset = isAll ? 0 : (parsedPage - 1) * parsedLimit;

            const today = new Date().toISOString().split("T")[0];

            if (role !== "CUSTOMER") {
            await Coupon.update(
                { isActive: false },
                {
                    where: {
                        endDate: {[Op.lt]: today,},
                        isActive: true,
                    },
                }
            );
            }

            let whereCondition = {};       

            if (role === "CUSTOMER") {
                whereCondition.startDate = {
                    [Op.lte]: today,
                };

                whereCondition.endDate = {
                    [Op.gte]: today,
                };
            }

            const parsedIsActive =
                isActive === "true" ? true :
                isActive === "false" ? false :
                null;

            if (parsedIsActive !== null) {
                whereCondition.isActive = parsedIsActive;
            }

            if (visibility) {
                whereCondition.visibility = visibility;
            }

            if (applicableType) {
                whereCondition.applicableType =
                    applicableType === "allProduct"
                        ? "all"
                        : applicableType;
            }

            if (search) {
            whereCondition[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
            }

            const totalRecords = await Coupon.count({
                where: whereCondition,
            });

            const queryOptions = {
                where: whereCondition,
                attributes: [
                    "id",
                    "code",
                    "name",
                    "description",
                    "usedCount",
                    "discountType",
                    "discountValue",
                    "applicableType",
                    "minOrderAmount",
                    "maxOrderAmount",
                    "visibility",
                    "isActive",
                    "startDate",
                    "endDate",
                    [fn("COUNT", col("couponUsages.id")), "totalUsedCount"],
                    [
                    fn(
                        "COALESCE",
                        fn("SUM", col("couponUsages.discountAmount")),
                        0
                    ),
                    "totalUsedDiscount",
                    ],
                ],
                include: [
                    {
                    model: CouponUsages,
                    as: "couponUsages",
                    attributes: [],
                    required: false,
                    },
                ],
                group: ["Coupon.id"],
                order: [["createdAt", "DESC"]],
                subQuery: false,
            };

            if (!isAll) {
                queryOptions.limit = parsedLimit;
                queryOptions.offset = offset;
            }

            const coupons = await Coupon.findAll(queryOptions);


            return res.status(200).json({
                success: true,
                message: "Coupons data fetched successfully",
                currentPage: isAll ? 1 : parsedPage,
                totalPages: isAll ? 1 : Math.ceil(totalRecords / parsedLimit),
                totalRecords,
                data: coupons,
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch coupons",
            });
        }
    },

    async getValidCoupons(req, res) {
        try {
            const userId = req.user.id;

            const cartItems = await Cart.findAll({
            where: { userId },
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "categoryId", "productName"],
                },
                {
                    model: ProductVariant,
                    as: "variant",
                    attributes: ["id"],
                },
            ],
            });

            if (!cartItems.length) {
            return res.status(200).json({
                success: true,
                coupons: [],
            });
            }

            const productIds = [
            ...new Set(cartItems.map((item) => item.product.id)),
            ];

            // console.log("cart productIds",productIds);
            

            const categoryIds = [
            ...new Set(cartItems.map((item) => item.product.categoryId)),
            ];

            const variantIds = [
            ...new Set(
                cartItems
                .map((item) => item.variant?.id)
                .filter(Boolean)
            ),
            ];

            const now = new Date();

            const activeCoupons = await Coupon.findAll({
                where: {
                    isActive: true,
                    visibility:"public",
                    startDate: {
                        [Op.lte]: now,
                    },
                    endDate: {
                        [Op.gte]: now,
                    },
                },
                order: [["createdAt", "DESC"]], 
                raw: true,
            });

            // console.log("activeCoupons",activeCoupons);
            

            if (!activeCoupons.length) {
            return res.status(200).json({
                success: true,
                coupons: [],
            });
            }

            const couponIds = activeCoupons.map((c) => c.id);

            const couponCategories = await CouponCategory.findAll({
                where: {
                    couponId: {
                        [Op.in]: couponIds,
                    },
                },
                raw: true,
            });

            // console.log("couponCategories",couponCategories);

            const couponProducts = await CouponProduct.findAll({
                where: {
                    couponId: {
                        [Op.in]: couponIds,
                    },
                },
                raw: true,
            });

            // console.log("couponProducts",couponProducts);

            const couponVariants = await CouponVariant.findAll({
                where: {
                    couponId: {
                    [Op.in]: couponIds,
                    },
                },
                raw: true,
            });

            const categoryMap = {};
            const productMap = {};
            const variantMap = {};

            couponCategories.forEach((row) => {
                if (!categoryMap[row.couponId]) {
                    categoryMap[row.couponId] = [];
                }
                categoryMap[row.couponId].push(row.categoryId);
            });

            couponProducts.forEach((row) => {
                if (!productMap[row.couponId]) {
                    productMap[row.couponId] = [];
                }
                productMap[row.couponId].push(row.productId);
            });

            couponVariants.forEach((row) => {
                if (!variantMap[row.couponId]) {
                    variantMap[row.couponId] = [];
                }
                variantMap[row.couponId].push(row.variantId);
            });

            const availableCoupons = [];

            for (const coupon of activeCoupons) {
                let applicable = false;

                switch (coupon.applicableType) {
                    case "all":
                        applicable = true;
                        break;

                    case "category": {
                        const couponCategoryIds =
                            categoryMap[coupon.id] || [];

                        applicable = categoryIds.some((id) =>
                            couponCategoryIds.includes(id)
                        );

                        break;
                    }

                    case "product": {
                        const couponProductIds =
                            productMap[coupon.id] || [];

                        applicable = productIds.some((id) =>
                            couponProductIds.includes(id)
                        );

                        break;
                    }

                    case "variant": {
                        const couponVariantIds =
                            variantMap[coupon.id] || [];

                        applicable = variantIds.some((id) =>
                            couponVariantIds.includes(id)
                        );

                        break;
                    }

                    default:
                    applicable = false;
                }

                if (applicable) {
                    availableCoupons.push({
                        id: coupon.id,
                        code: coupon.code,
                        name: coupon.name,
                        description: coupon.description,

                        discountType: coupon.discountType,
                        discountValue: coupon.discountValue,

                        minOrderAmount: coupon.minOrderAmount,
                        maxDiscountAmount: coupon.maxDiscountAmount,

                        applicableType: coupon.applicableType,
                    });
                }   
            }

            return res.status(200).json({
            success: true,
            coupons: availableCoupons,
            });
        } catch (error) {
            console.error("Coupon Error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch coupons",
                error: error.message,
            });
        }
    },

    async applyCoupon(req, res) {
        try {
            const userId = req.user.id;
            const { couponCode } = req.params;

            const result = await validateCoupon({
                userId,
                couponCode
            });

            return res.status(200).json({
                success: true,
                message:"Coupon applied successfully",
                couponId: result.coupon.id,
                couponCode: result.coupon.code,
                discount:  Number(result.discount.toFixed(2)),
         
        });
        } catch (error) {
            console.log("Apply Coupon Error:",error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },
}
module.exports = CouponController;

const {
    Coupon,
    CouponCategory,
    CouponProduct,
    CouponVariant,
    CouponUsages,
    Cart,
    Product,
    ProductVariant
} = require("../models");

async function validateCoupon({
        userId,
        couponCode
    }) 
    {
        if (!couponCode) {
            throw new Error("Coupon code is required");
        }

        const coupon = await Coupon.findOne({
            where: {
                code: couponCode.trim(),
                isActive: true,
            },
        });

        if (!coupon) {
            throw new Error("Invalid coupon code");
        }

        const today = new Date().toISOString().split("T")[0];

        if (coupon.startDate && today < coupon.startDate) {
          throw new Error("Coupon is not active yet");
        }

        if (coupon.endDate && today > coupon.endDate) {
          throw new Error("Coupon has expired");
        }

        const usageCount = await CouponUsages.count({
            where: {
                couponId: coupon.id,
                userId,
            },
        });

        if (coupon.usagePerUser && usageCount >= coupon.usagePerUser
            ) {
            throw new Error("Coupon usage limit exceeded");
        }

        const totalCouponUsedCount = await CouponUsages.count({
            where: {
                couponId: coupon.id,
            },
        });

        if (coupon.usedCount !== 1 && totalCouponUsedCount >= coupon.usedCount
            ) {
            throw new Error("This coupon has reached its maximum usage limit and can no longer be applied.");
        }

        const cartItems = await Cart.findAll({
            where: { userId },
            include: [
                {
                model: Product,
                as: "product",
                attributes: [
                    "id",
                    "categoryId",
                    "productName",
                ],
                },
                {
                model: ProductVariant,
                as: "variant",
                attributes: [
                    "id",
                    "price",
                    "discountedPrice",
                    "discountPercent",
                ],
                },
            ],
        });

        if (!cartItems.length) {
            throw new Error("Cart is empty");
        }

        let eligibleItems = [];

        if (coupon.applicableType === "all") {
                eligibleItems = cartItems;
        }

        else if (coupon.applicableType === "category") {
            const mappings = await CouponCategory.findAll({
                where: {
                    couponId: coupon.id,
                },
            });

            const categoryIds = mappings.map(
                (item) => item.categoryId
            );

            eligibleItems = cartItems.filter((item) =>
                categoryIds.includes(
                    item.product.categoryId
                )
            );
        }

        else if (coupon.applicableType === "product") {
            const mappings = await CouponProduct.findAll({
                where: {
                    couponId: coupon.id,
                },
            });

            const productIds = mappings.map(
                (item) => item.productId
            );

            eligibleItems = cartItems.filter((item) =>
                productIds.includes(
                    item.product.id
                )
            );

            console.log("eligibleItems",eligibleItems);
            
        }

        else if (coupon.applicableType === "variant") {
            const mappings = await CouponVariant.findAll({
                where: {
                couponId: coupon.id,
                },
            });

            const variantIds = mappings.map(
                (item) => item.variantId
            );

            eligibleItems = cartItems.filter(
                (item) =>
                item.variant &&
                variantIds.includes(
                    item.variant.id
                )
            );
        }

        if (!eligibleItems.length) {
            throw new Error("Coupon is not applicable to cart items");
        }

        const eligibleSubtotal =
            eligibleItems.reduce((sum, item) => {
                const price =
                Number(item.variant?.discountedPrice) || 0;
                return (
                sum +
                price * Number(item.quantity)
                );
            }, 0);


        // console.log("eligibleSubtotal",eligibleSubtotal);
        

        if (coupon.minOrderAmount && eligibleSubtotal < coupon.minOrderAmount ) {
            throw new Error(`Minimum purchase amount ₹${coupon.minOrderAmount} required`);
        }

        if (coupon.maxOrderAmount && eligibleSubtotal > coupon.maxOrderAmount ) {
            throw new Error(`Maximum purchase amount ₹${coupon.maxOrderAmount} allowed`);
        }

        let discount = 0;

        if (coupon.discountType ==="percentage") {
                discount = (eligibleSubtotal * coupon.discountValue) / 100;
        } else {
                discount =Number(coupon.discountValue) || 0;
                if (
                    discount >
                    eligibleSubtotal
                ) {
                    discount =
                    eligibleSubtotal;
                }
        }
        // console.log("discount",discount);


        return {
            coupon,
            discount,
            eligibleSubtotal
        };
};

module.exports = {
    validateCoupon
};
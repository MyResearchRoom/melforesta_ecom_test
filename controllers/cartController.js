const { Category, Product, ProductImage, Cart, ProductStock ,ProductVariant} = require("../models")

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

const MAX_CART_QTY = Number(process.env.CART_INCREMENET_QUANTITY) || 5;

const CartController = {

    async addToCart(req, res) {
        try {
            const userId = req.user.id;
            const { productId, quantity,variantId } = req.body;

            if (!productId || !variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Product and variant are required"
                });
            }

            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            const variant = await ProductVariant.findByPk(variantId);
            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: "Product variant not found"
                });
            }

            if (variant.currentAvailableStock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock for selected variant"
                });
            }

            let cartItem = await Cart.findOne({
                where: { userId, productId, variantId }
            });

            if (cartItem) {
                return res.status(400).json({
                    success: false,
                    message: "Product already in cart"
                });
            }

            cartItem = await Cart.create({
                userId,
                productId,
                variantId:variantId,
                quantity: quantity || 1,               
                selectedPrice: variant.discountedPrice || null,
                selectedWeight: variant.weight || null
            });

            return res.status(200).json({
                success: true,
                message: "Product added to cart successfully",
                data: cartItem
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to add to cart",
                error: error.message
            });
        }
    },

    async incrementQuantity(req, res) {
        try {
            const userId = req.user.id;
            const { productId, variantId } = req.body;
            
            if (!productId || !variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Product and variant are required"
                });
            }

            const cartItem = await Cart.findOne({
                where: {
                    userId,
                    productId,
                    variantId,
                }
            });

            if (cartItem.quantity >= MAX_CART_QTY) {
                return res.status(200).json({
                    success: false,
                    message: `You can only add up to ${MAX_CART_QTY} items for this product`
                });
            }

            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found in cart"
                });
            }

            const variant = await ProductVariant.findByPk(variantId);

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: "Variant not found"
                });
            }

            if (cartItem.quantity >= variant.currentAvailableStock) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more, Only ${variant.currentAvailableStock} items available in stock.`
                });
            }

            cartItem.quantity += 1;
            await cartItem.save();

            return res.status(200).json({
                success: true,
                message: "Cart item quantity incremented",
                dat: cartItem
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Failed to increment quantity"
            })
        }
    },

    async decrementQuantity(req, res) {
        try {
            const userId = req.user.id;
            const { productId, variantId } = req.body;
            
            if (!productId || !variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Product and variant are required"
                });
            }

            const cartItem = await Cart.findOne({
                where: {
                    userId,
                    productId,               
                    variantId,
                }
            });

            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found in cart"
                });
            }

            if (cartItem.quantity <= 1) {
                return res.status(200).json({
                    success: true,
                    message: "Minimum quantity is 1. Remove item to delete from cart."
                });
            }

            cartItem.quantity -= 1;
            await cartItem.save();

            return res.status(200).json({
                success: true,
                message: "Cart item quantity decremented",
                data: cartItem
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Failed to decrement quantity"
            })
        }
    },

    async removeFromCart(req, res) {
        try {
            const userId = req.user.id;
            const { productId, variantId } = req.body;

            if (!productId || !variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Product and variant are required"
                });
            }

            const cartItem = await Cart.findOne({
                where: {
                    userId,
                    productId,
                    variantId,
                }
            });

            if (!cartItem) {
                return res.status(400).json({
                    success: false,
                    message: "Product not found in cart"
                });
            }

            await cartItem.destroy();

            return res.status(200).json({
                success: true,
                message: "Product removed from cart successfully"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Failed to remove product from cart"
            });
        }
    },

    // async getCartItems(req, res) {
    //     try {

    //         const userId = req.user.id;

    //         const cartItems = await Cart.findAll({
    //             where: { userId },
    //             include: [
    //                 {
    //                     model: Product,
    //                     as: "product",
    //                     attributes: [
    //                         "id",
    //                         "productName",
    //                         "description",
    //                         "categoryId",
    //                         "gstPercent",
    //                         "specifications",
    //                         "handlingCharges",
    //                     ],
    //                     include: [
    //                         {
    //                             model: ProductImage,
    //                             as: "images",
    //                             attributes: ["id", "image", "imageContentType"]
    //                         },
    //                         {
    //                             model: Category,
    //                             as: "category",
    //                             attributes: ["id", "name"]
    //                         },
    //                         {
    //                             model: ProductStock,
    //                             as: "stocks",
    //                             attributes: ["lowStockThreshold"],
    //                             order: [["createdAt", "DESC"]],
    //                             limit: 1
    //                         }
    //                     ],

    //                 },
    //                 {
    //                     model:ProductVariant,
    //                     as:"variant",
    //                 }
    //             ]
    //         });

    //         const formattedCartItems = cartItems.map(item => {
    //             const product = item.product;
    //             const productVariant=item.variant;


    //             const totalStock = productVariant.currentAvailableStock;
    //             const lowStockThreshold =
    //                 product.stocks && product.stocks[0]
    //                     ? product.stocks[0].lowStockThreshold
    //                     : null;

    //             let stockStatus = "noStockData";
    //             if (totalStock !== null && totalStock !== undefined) {
    //                 if (totalStock === 0) stockStatus = "outOfStock";
    //                 else if (lowStockThreshold && totalStock <= lowStockThreshold)
    //                     stockStatus = "lowStock";
    //                 else stockStatus = "inStock";
    //             }

    //             return {
    //                 id: item.id,
    //                 quantity: item.quantity,
    //                 selectedPrice: productVariant.selectedPrice,
    //                 selectedWeight: productVariant.selectedWeight,
    //                 discountPercent:productVariant.discountPercent,
    //                 originalPrice:productVariant.price,
    //                 totalStock:totalStock,

    //                 product: {
    //                     id: product.id,
    //                     productName: product.productName,
    //                     originalPrice: product.originalPrice,
    //                     discountPercent: product.discountPercent,
    //                     discountedPrice: product.discountedPrice,
    //                     category: product.category,
    //                     images: product.images.map(img => ({
    //                         id: img.id,
    //                         productId: img.productId,
    //                         image: img.image
    //                             ? `data:${img.imageContentType};base64,${img.image.toString("base64")}`
    //                             : null
    //                     })),
    //                     stockStatus,                        
    //                 }

    //             };
    //         });

    //         return res.status(200).json({
    //             success: true,
    //             message: "Cart items fetched successfully",
    //             data: formattedCartItems
    //         })

    //     } catch (error) {
    //         console.log(error);
    //         return res.status(500).json({
    //             success: false,
    //             message: "Failed to get cart items"
    //         });
    //     }
    // },

    async getCartItems(req, res) {
        try {
            const userId = req.user.id;

            const cartItems = await Cart.findAll({
                where: { userId },
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: [
                            "id",
                            "productName",
                            "description",
                            "categoryId",
                            "gstPercent",
                            "specifications",
                                "handlingCharges",
                        ],
                        include: [
                            {
                                model: ProductImage,
                                as: "images",
                                attributes: ["id", "image", "imageContentType"]
                            },
                            {
                                model: Category,
                                as: "category",
                                attributes: ["id", "name"]
                            },
                            {
                                model: ProductStock,
                                as: "stocks",
                                attributes: ["lowStockThreshold"],
                                order: [["createdAt", "DESC"]],
                                limit: 1
                            }
                        ],
                    },
                    {
                        model: ProductVariant,
                        as: "variant",
                    }
                ]
            });

            const formattedCartItems = cartItems.map(item => {
                const product = item.product;
                const variant = item.variant;

                const totalStock = variant?.currentAvailableStock ?? 0;

                const lowStockThreshold =
                    product?.stocks?.[0]?.lowStockThreshold ?? 0;

                let stockStatus = "noStockData";

                if (totalStock === 0) stockStatus = "outOfStock";
                else if (totalStock <= lowStockThreshold) stockStatus = "lowStock";
                else stockStatus = "inStock";

                return {
                    id: item.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,

                    selectedPrice: item.selectedPrice,
                    selectedWeight: item.selectedWeight,

                    discountPercent: variant?.discountPercent,
                    originalPrice: variant?.price,
                    discountedPrice: variant?.discountedPrice,
                    totalAvailableStock:totalStock,

                    product: {
                        id: product.id,
                        productName: product.productName,
                        category: product.category,
                        gstPercent:product.gstPercent,
                        handlingCharges:product.handlingCharges,
                        specifications: parseField(product.specifications, {}),

                        images: product.images.map(img => ({
                            id: img.id,
                            image: img.image
                                ? `data:${img.imageContentType};base64,${img.image.toString("base64")}`
                                : null
                        })),

                        stockStatus,
                    },

                    variant:variant
                };
            });

            return res.status(200).json({
                success: true,
                message: "Cart items fetched successfully",
                data: formattedCartItems
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Failed to get cart items"
            });
        }
    },

}

module.exports = CartController;
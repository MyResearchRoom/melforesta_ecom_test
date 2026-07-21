const { where } = require("sequelize");
const { Category, Product, ProductImage, ProductStock, Wishlist,ProductVariant } = require("../models");

const WishlistController = {

    async addToWishlist(req, res) {
        try {

            const userId = req.user.id;
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: "Product Id is required"
                });
            }

            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            const existing = await Wishlist.findOne({
                where: { userId, productId }
            })

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Product already in wishlist"
                });
            }

            const wishlistItem = await Wishlist.create({
                userId,
                productId
            });

            return res.status(200).json({
                success: true,
                message: "Product added to wishlist successfully",
                data: wishlistItem
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to add to wishlist"
            })
        }
    },

    async removeFromWishlist(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: "Product Id is required"
                });
            }

            const wishlistItem = await Wishlist.findOne({
                where: { userId, productId }
            });

            if (!wishlistItem) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found in wishlist"
                });
            }

            await wishlistItem.destroy();

            return res.status(200).json({
                success: true,
                message: "Product removed from wishlist successfully"
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Failed to remove product from wishlist"
            });
        }
    },

    async getWishlistItems(req, res) {
        try {
            const userId = req.user.id;

            const wishlistItems = await Wishlist.findAll({
                where: { userId },
                include: [
                    {
                        model: Product,
                        as: "product",
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
                                model: ProductImage,
                                as: "images",
                                attributes: ["id", "image", "imageContentType"],
                                limit: 1
                            },
                            {
                                model: ProductVariant,
                                as: "variants",
                                separate: true
                            },
                            {
                                model: Category,
                                as: "category",
                                attributes: ["id", "name"]
                            },
                            {
                                model: ProductStock,
                                as: "stocks",
                                attributes: ["id", "lowStockThreshold", "createdAt"],
                                order: [["createdAt", "DESC"]],
                                limit: 1
                            },
                        ]
                    },
                ]
            });

            const wishlistItemsData = wishlistItems.map(item => {
                const product = item.product.toJSON();

                if (product.images && product.images.length > 0) {
                    product.images = product.images.slice(0, 1).map(img => ({
                        id: img.id,
                        image: `data:${img.imageContentType};base64,${img.image.toString('base64')}`
                    }));
                }

                const totalStock = product?.variants?.[0]?.totalStock;
                const lowStockThreshold = product.stocks && product.stocks[0] ? product.stocks[0].lowStockThreshold : null;

                let stockStatus = "noStockData";
                if (totalStock !== null) {
                    if (totalStock === 0) stockStatus = "outOfStock";
                    else if (lowStockThreshold && totalStock <= lowStockThreshold) stockStatus = "lowStock";
                    else stockStatus = "inStock";
                }

                return {
                    ...item.toJSON(),
                    product,
                    stockStatus,
                    totalStock
                };
            });


            return res.status(200).json({
                success: true,
                message: "Wishlist items fetched successfully",
                data: wishlistItemsData
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to get wishlist items"
            })
        }
    },

}

module.exports = WishlistController;
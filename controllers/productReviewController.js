const { where } = require("sequelize");
const { User, ProductOrder, ProductOrderItem, ProductReview } = require("../models");

const ProductReviewController = {

    async addReview(req, res) {
        try {
            const userId = req.user.id;
            const { orderId, productId } = req.params;
            const { rating, review } = req.body;

            if (!rating || !productId || !orderId) {
                return res.status(400).json({
                    success: false,
                    message: "Order ID, Product ID, and rating are required"
                });
            }

            const order = await ProductOrder.findOne({
                where: { orderId, userId },
                include: [
                    {
                        model: ProductOrderItem,
                        as: "items"
                    }
                ]
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (order.status !== "delivered") {
                return res.status(400).json({
                    success: false,
                    message: "You can only review products after they are delivered"
                });
            }

            const item = order.items.find(i => i.productId === Number(productId));
            if (!item) {
                return res.status(400).json({
                    success: false,
                    message: "This product is not part of the order"
                });
            }

            const existingReview = await ProductReview.findOne({
                where: { productId, userId }
            });
            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: "You have already reviewed this product"
                });
            }

            const newReview = await ProductReview.create({
                productId,
                userId,
                rating,
                review
            });

            return res.status(201).json({
                success: true,
                message: "Rating and review added successfully",
                data: newReview
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to add rating and review"
            });
        }
    },

    async getReviews(req, res) {
        try {
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: "Product ID is required"
                });
            }

            const reviews = await ProductReview.findAll({
                where: { productId },
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });


            const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

            return res.status(200).json({
                success: true,
                message: "Product reviews fetched successfully",
                data: {
                    reviews,
                    averageRating: parseFloat(averageRating.toFixed(2)),
                }
            });
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch product reviews"
            });
        }
    },

}

module.exports = ProductReviewController;
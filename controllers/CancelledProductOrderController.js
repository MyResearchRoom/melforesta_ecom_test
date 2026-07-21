const { where } = require("sequelize");
const { User, Product, ProductImage, ProductOrder, ProductOrderItem, CancelledProductOrder,ProductVariant, sequelize } = require("../models");

const CancelledProductOrderController = {

    //customer
    async cancelProductOrder(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const userId = req.user.id;
            const { orderId, orderItemId } = req.params;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: "Reason is required"
                });
            }

            const order = await ProductOrder.findOne({
                where: { orderId },
                transaction
            });

            if (!order)
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });

            if (['shipped', 'outForDelivery', 'delivered'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot cancel order as order is already shipped or delivered"
                });
            }

            const orderItem = await ProductOrderItem.findOne({
                where: {
                    id: orderItemId,
                    orderId
                },
                transaction
            });

            if (!orderItem)
                return res.status(404).json({
                    success: false,
                    message: "Order item not found"
                });

            const alreadyCancelled = await CancelledProductOrder.findOne({
                where: {
                    orderItemId,
                    orderId
                },
                transaction
            });

            if (alreadyCancelled) {
                return res.status(400).json({
                    success: false,
                    message: "This product has already been cancelled"
                });
            }

            const refundAmount = parseFloat(orderItem.totalPrice);

            await CancelledProductOrder.create({
                orderId,
                orderItemId,
                userId,
                reason,
                refundAmount,
            }, { transaction });

            const variant = await ProductVariant.findByPk(orderItem.variantId, {
                    transaction
            });

            if (!variant) {
                    await transaction.rollback();

                    return res.status(404).json({
                        success: false,
                        message: "Variant not found"
                    });
            }

            variant.currentAvailableStock =
                Number(variant.currentAvailableStock) + Number(orderItem.quantity);

            await variant.save({ transaction });

            const product =await Product.findByPk(orderItem.productId, {
                    transaction
            });

            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            const gstPercent = parseFloat(product.gstPercent) || 0;

            const itemHandling = parseFloat(product.handlingCharges) || 0;

            // const productPrice=parseFloat(orderItem.price) || 0;
        

            //totalItems
            const subTotal=Number(orderItem.price) * Number(orderItem.quantity);

            const discount =
                Number(orderItem.discount) *
                Number(orderItem.quantity);

            const gst = (variant.discountedPrice * gstPercent /100) * orderItem.quantity 


            const handling = itemHandling * orderItem.quantity;

            const total=orderItem.totalPrice;

            // console.log(subTotal,discount,gst,handling,total);
            
            

            // order.totalItems=order.totalItems-orderItem.quantity;
            // order.subTotal=order.subTotal-subTotal;
            // order.discountAmount= order.discountAmount-discount;
            // order.gstAmount=order.gstAmount-gst;
            // order.handlingCharges=order.handlingCharges-handling;
            // order.totalAmount =
            //     Number(order.totalAmount) -
            //     Number(total);

            order.totalItems = Math.max(
                0,
                Number(order.totalItems) - Number(orderItem.quantity)
            );

            order.subTotal = Math.max(
                0,
                Number(order.subTotal) - Number(subTotal)
            );

            order.discountAmount = Math.max(
                0,
                Number(order.discountAmount) - Number(discount)
            );

            order.gstAmount = Math.max(
                0,
                Number(order.gstAmount) - Number(gst)
            );

            order.handlingCharges = Math.max(
                0,
                Number(order.handlingCharges) - Number(handling)
            );

            order.totalAmount = Math.max(
                0,
                Number(order.totalAmount) - Number(total)
            );

            await order.save({ transaction });

            await transaction.commit();
            return res.status(200).json({
                success: true,
                message: "Product cancelled successfully",
                data: { orderId, orderItemId, refundAmount }
            });

        } catch (error) {
            await transaction.rollback();
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to cancel product"
            });
        }
    },

    //customer
    async getCancelledProductOrders(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const { rows: cancelledOrders, count: totalRecords } = await CancelledProductOrder.findAndCountAll({
                where: { userId },
                include: [
                    {
                        model: ProductOrder,
                        as: "order",
                        attributes: ["orderId", "totalAmount", "status"]
                    },
                    {
                        model: ProductOrderItem,
                        as: "orderItem",
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "productName"],
                                include: [
                                    {
                                        model: ProductImage,
                                        as: "images",
                                        attributes: ["id", "image", "imageContentType"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email", "mobileNumber"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                distinct: true
            });

            const dataWithFlag = cancelledOrders.map(order => {
                const orderData = order.toJSON();

                if (orderData.orderItem && orderData.orderItem.product && orderData.orderItem.product.images) {
                    orderData.orderItem.product.images = orderData.orderItem.product.images.map(img =>
                        img.image ? `data:${img.imageContentType};base64,${img.image.toString('base64')}` : null
                    );
                }

                orderData.orderItem.isCancelled = true;
                return orderData;
            });

            return res.status(200).json({
                success: true,
                message: "Cancelled orders fetched successfully",
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: dataWithFlag
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch cancelled orders"
            });
        }
    },

    //admin side (PRODUCT_MANAGER)
    async getAllCancelledProductOrders(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};
            if (status) {
                whereClause.status = status
            }

            const { rows: cancelledOrders, count: totalRecords } = await CancelledProductOrder.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: ProductOrder,
                        as: "order",
                        attributes: ["orderId", "totalAmount", "status"]
                    },
                    {
                        model: ProductOrderItem,
                        as: "orderItem",
                        attributes: ["id", "quantity", "price", "totalPrice"],
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "productName"],
                                include: [
                                    {
                                        model: ProductImage,
                                        as: "images",
                                        attributes: ["id", "image", "imageContentType"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                distinct: true
            });

            const dataWithImages = cancelledOrders.map(order => {
                const orderData = order.toJSON();

                if (orderData.orderItem && orderData.orderItem.product && orderData.orderItem.product.images) {
                    orderData.orderItem.product.images = orderData.orderItem.product.images.map(img =>
                        img.image ? `data:${img.imageContentType};base64,${img.image.toString('base64')}` : null
                    );
                }

                return orderData;
            });

            return res.status(200).json({
                success: true,
                message: "All cancelled orders fetched successfully",
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: dataWithImages
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch cancelled orders"
            });
        }
    },

    async getCancelledProductOrderById(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const userRole = req.user.role;

            const whereClause = { id };
            if (userRole === "customer") {
                whereClause.userId = userId;
            }

            const cancelledOrder = await CancelledProductOrder.findOne({
                where: whereClause,
                include: [
                    {
                        model: ProductOrder,
                        as: "order",
                        attributes: ["orderId", "totalAmount", "paymentMethod", "paymentId","razorpayOrderId", "paymentStatus", "status", "createdAt"]
                    },
                    {
                        model: ProductOrderItem,
                        as: "orderItem",
                        attributes: ["id", "quantity", "price", "discount", "totalPrice"],
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "productName",],
                                include: [
                                    {
                                        model: ProductImage,
                                        as: "images",
                                        attributes: ["id", "image", "imageContentType"],
                                    },
                                ]
                            }
                        ]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email", "mobileNumber"]
                    }
                ]
            });

            if (!cancelledOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Cancelled product order not found"
                });
            }

            const cancelledOrderData = cancelledOrder.toJSON();
            if (cancelledOrderData.orderItem && cancelledOrderData.orderItem.product && cancelledOrderData.orderItem.product.images) {
                cancelledOrderData.orderItem.product.images = cancelledOrderData.orderItem.product.images.map(img => {
                    return img.image
                        ? `data:${img.imageContentType};base64,${img.image.toString('base64')}`
                        : null;
                });
            }

            return res.status(200).json({
                success: true,
                message: "Cancelled product order fetched successfully",
                data: cancelledOrderData
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch cancelled product order"
            });
        }
    },

    async refundCancelledProductOrder(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['pending', 'refunded'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status is required and must be one of: ${validStatuses.join(', ')}`
                });
            }

            const cancelledOrder = await CancelledProductOrder.findOne({ where: { id }, transaction });
            if (!cancelledOrder) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: "Cancelled order not found"
                });
            }

            if (cancelledOrder.status === 'refunded') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Order is already refunded"
                });
            }

            cancelledOrder.status = status;
            await cancelledOrder.save({ transaction });

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: "Cancelled order status updated successfully",
                data: {
                    id: cancelledOrder.id,
                    orderId: cancelledOrder.orderId,
                    orderItemId: cancelledOrder.orderItemId,
                    status: cancelledOrder.status
                }
            });

        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({
                success: false,
                message: "Failed to update cancelled order status"
            });
        }
    },

}

module.exports = CancelledProductOrderController;
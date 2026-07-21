const { where } = require("sequelize");
const { User, CustomerAddresses, Product, ProductImage, ProductOrder, ProductOrderItem, ReturnedProductOrder, ProductVariant,ReturnProductOrderMedia, sequelize } = require("../models");

const ReturnedProductOrderController = {

    async returnProductOrder(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const userId = req.user.id;
            const { orderId, orderItemId } = req.params;
            const { reason, returnQuantity = 1 } = req.body;

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

            const existingReturn = await ReturnedProductOrder.findOne({
                where: { orderId, orderItemId },
                transaction
            });

            if (existingReturn) {
                return res.status(400).json({
                    success: false,
                    message: "This product item has already been returned"
                });
            }

            const orderItem = await ProductOrderItem.findOne({
                where: { id: orderItemId, orderId },
                include: [
                    {
                        model: Product,
                        as: "product"
                    }
                ],
                transaction
            });

            if (!orderItem) {
                return res.status(404).json({
                    success: false,
                    message: "Order item not found"
                });
            }

            if (returnQuantity > orderItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Return quantity cannot exceed ordered quantity"
                });
            }

            const refundAmount = parseFloat(orderItem.totalPrice) * (returnQuantity / orderItem.quantity);

            const returnedProduct = await ReturnedProductOrder.create({
                orderId,
                orderItemId,
                userId,
                returnQuantity,
                refundAmount,
                reason
            }, { transaction });

            // const variant = await ProductVariant.findByPk(orderItem.variantId, {
            //         transaction
            // });

            // if (!variant) {
            //     await transaction.rollback();

            //     return res.status(404).json({
            //         success: false,
            //         message: "Variant not found"
            //     });
            // }

            // const product =await Product.findByPk(orderItem.productId, {
            //         transaction
            // });

            // if (!product) {
            //     await transaction.rollback();
            //     return res.status(404).json({
            //         success: false,
            //         message: "Product not found"
            //     });
            // }

            // const gstPercent = parseFloat(product.gstPercent) || 0;

            // const itemHandling = parseFloat(product.handlingCharges) || 0;

            // const subTotal=Number(orderItem.price) * Number(orderItem.quantity);

            // const discount =
            //     Number(orderItem.discount) *
            //     Number(orderItem.quantity);

            // const gst = (variant.discountedPrice * gstPercent /100) * orderItem.quantity 


            // const handling = itemHandling * orderItem.quantity;

            // const total=orderItem.totalPrice;

            // order.totalItems = Math.max(
            //     0,
            //     Number(order.totalItems) - Number(orderItem.quantity)
            // );

            // order.subTotal = Math.max(
            //     0,
            //     Number(order.subTotal) - Number(subTotal)
            // );

            // order.discountAmount = Math.max(
            //     0,
            //     Number(order.discountAmount) - Number(discount)
            // );

            // order.gstAmount = Math.max(
            //     0,
            //     Number(order.gstAmount) - Number(gst)
            // );

            // order.handlingCharges = Math.max(
            //     0,
            //     Number(order.handlingCharges) - Number(handling)
            // );

            // order.totalAmount = Math.max(
            //     0,
            //     Number(order.totalAmount) - Number(total)
            // );

            // await order.save({ transaction });

            await transaction.commit();

            if (req.files && req.files.media?.length) {
                if (req.files.media.length > 3) return res.status(400).json({ success: false, message: "Max 3 media only" });

                const mediaData = req.files.media.map(file => ({
                    returnId: returnedProduct.id,
                    media: file.buffer,
                    mediaContentType: file.mimetype,
                    mediaName: file.originalname
                }));

                await ReturnProductOrderMedia.bulkCreate(mediaData);
            }

            return res.status(201).json({
                success: true,
                message: "Product return requested successfully",
                data: returnedProduct
            });

        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({
                success: false,
                message: "Failed to return product"
            });
        }
    },

    async getReturnedProducts(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const { rows: returnedOrders, count: totalRecords } = await ReturnedProductOrder.findAndCountAll({
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
                                attributes: ["id", "productName"]
                            }
                        ]
                    },
                    {
                        model: ReturnProductOrderMedia,
                        as: "images",
                        attributes: ["id", "mediaName", "media", "mediaContentType"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true
            });

            const formattedOrders = returnedOrders.map(order => {
                const orderData = order.toJSON();
                if (orderData.images && orderData.images.length) {
                    orderData.images = orderData.images.map(img => ({
                        id: img.id,
                        mediaName: img.mediaName,
                        mediaContentType: img.mediaContentType,
                        media: img.media ? `data:${img.mediaContentType};base64,${img.media.toString('base64')}` : null
                    }));
                }
                return orderData;
            });

            return res.status(200).json({
                success: true,
                message: "Returned products fetched successfully",
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: formattedOrders
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch returned products"
            });
        }
    },

    async getAllReturnedProducts(req, res) {
        try {
            const { page = 1, limit = 10, returnStatus } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};
            if (returnStatus) {
                whereClause.returnStatus = returnStatus;
            }

            const { rows: returnedOrders, count: totalRecords } = await ReturnedProductOrder.findAndCountAll({
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
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "productName"]
                            }
                        ]
                    },
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email"]
                    },
                    {
                        model: ReturnProductOrderMedia,
                        as: "images",
                        attributes: ["id", "mediaName", "mediaContentType", "media"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
                distinct: true
            });

            const formattedOrders = returnedOrders.map(order => {
                const orderData = order.toJSON();
                if (orderData.images && orderData.images.length) {
                    orderData.images = orderData.images.map(img => ({
                        id: img.id,
                        mediaName: img.mediaName,
                        mediaContentType: img.mediaContentType,
                        media: img.media ? `data:${img.mediaContentType};base64,${img.media.toString('base64')}` : null
                    }));
                }
                return orderData;
            });

            return res.status(200).json({
                success: true,
                message: "Returned products fetched successfully",
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: formattedOrders
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch returned products"
            });
        }
    },

    async getReturnedProductById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Returned product ID is required"
                });
            }

            const returnedOrder = await ReturnedProductOrder.findOne({
                where: { id },
                include: [
                    {
                        model: ProductOrder,
                        as: "order",
                        attributes: ["orderId", "totalAmount", "paymentMethod", "status", "addressId"],
                        include: [
                            {
                                model: CustomerAddresses,
                                as: "address",
                                attributes: ["id", "flatNo", "buildingBlock", "floor", "buildingName", "streetName", "landmark", "city", "state", "pincode",
                                ]
                            }
                        ]
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
                    },
                    {
                        model: ReturnProductOrderMedia,
                        as: "images",
                        attributes: ["id", "mediaName", "media", "mediaContentType"]
                    }
                ]
            });

            if (!returnedOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Returned product not found"
                });
            }

            const returnedData = returnedOrder.toJSON();

            if (returnedData.images && returnedData.images.length) {
                returnedData.images = returnedData.images.map(img => ({
                    id: img.id,
                    mediaName: img.mediaName,
                    mediaContentType: img.mediaContentType,
                    media: img.media ? `data:${img.mediaContentType};base64,${img.media.toString('base64')}` : null
                }));
            }

            if (returnedData.orderItem?.product?.images && returnedData.orderItem.product.images.length) {
                returnedData.orderItem.product.images = returnedData.orderItem.product.images.map(img => ({
                    id: img.id,
                    image: img.image ? `data:${img.imageContentType};base64,${img.image.toString('base64')}` : null
                }));
            }

            return res.status(200).json({
                success: true,
                message: "Returned product details fetched successfully",
                data: returnedData
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch returned product details"
            });
        }
    },

    async assignPickupForReturn(req, res) {
        try {
            const { returnId } = req.params;
            const { pickupPersonId, pickupDate, pickUpTime } = req.body;

            if (!returnId || !pickupPersonId || !pickupDate || !pickUpTime) {
                return res.status(400).json({
                    success: false,
                    message: "returnId, pickupPersonId, pickupDate, and pickUpTime are required"
                });
            }

            const returnOrder = await ReturnedProductOrder.findOne({ where: { id: returnId } });
            if (!returnOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Returned order not found"
                });
            }

            if (returnOrder.returnStatus !== "accepted") {
                return res.status(400).json({
                    success: false,
                    message: "Pickup can only be assigned for accepted return orders"
                });
            }

            returnOrder.pickupPersonId = pickupPersonId;
            returnOrder.pickupDate = pickupDate;
            returnOrder.pickUpTime = pickUpTime;
            returnOrder.pickupStatus = "pending";
            await returnOrder.save();

            return res.status(200).json({
                success: true,
                message: "Pickup details assigned successfully",
                data: returnOrder
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to assign pickup details"
            });
        }
    },

    async updateReturnStatus(req, res) {
        try {
            const { returnId } = req.params;
            const { status, returnActionReason } = req.body;

            if (!returnId || !status || !returnActionReason) {
                return res.status(400).json({
                    success: false,
                    message: "returnId, status and returnActionReason are required"
                });
            }

            if (!["accepted", "rejected"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be 'accepted' or 'rejected'"
                });
            }

            const returnOrder = await ReturnedProductOrder.findOne({ where: { id: returnId } });
            if (!returnOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Returned order not found"
                });
            }

            if (returnOrder.returnStatus !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Return status can only be updated if it's pending"
                });
            }

            returnOrder.returnStatus = status;
            returnOrder.returnActionReason = returnActionReason
            await returnOrder.save();

            return res.status(200).json({
                success: true,
                message: `Return status updated to ${status}`,
                data: returnOrder
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update return status"
            });
        }
    },

    async updatePickupStatus(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { returnId } = req.params;
            const { status } = req.body;

            if (!returnId || !status) {
                return res.status(400).json({
                    success: false,
                    message: "returnId and status are required"
                });
            }

            if (!["pickedUp", "completed"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be 'pickedUp' or 'completed'"
                });
            }

            const returnOrder = await ReturnedProductOrder.findOne({
                where: { id: returnId },
                include: [
                    {
                        model: ProductOrderItem,
                        as: "orderItem",
                        attributes: ["id", "orderId","variantId"],
                        include: [
                            // { 
                            //     model: Product, 
                            //     as: "product" 
                            // },
                            {
                                model: ProductVariant,
                                as: "variant",
                                attributes: ["id", "totalStock",],
                            }
                        ]
                    }
                ],
                transaction
            });
            if (!returnOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Returned order not found"
                });
            }

            if (status === "pickedUp" && returnOrder.returnStatus !== "accepted") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot mark as pickedUp unless the return is accepted"
                });
            }

            if (status === "completed" && returnOrder.pickupStatus !== "pickedUp") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot mark as completed unless the order has been pickedUp"
                });
            }

            returnOrder.pickupStatus = status;
            await returnOrder.save({ transaction });

            if (status === "completed" && returnOrder.orderItem?.variant) {
                await returnOrder.orderItem.variant.increment("currentAvailableStock", { by: returnOrder.returnQuantity, transaction });
            }

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: `Pickup status updated to ${status}`,
                data: returnOrder
            });

        } catch (error) {
            await transaction.rollback();
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to update pickup status"
            });
        }
    },

    async refundReturnedProductOrder(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { returnId } = req.params;
            const { refundStatus } = req.body;

            const validStatuses = ['pending', 'refunded'];
            if (!refundStatus || !validStatuses.includes(refundStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Refund status is required and must be one of: ${validStatuses.join(', ')}`
                });
            }

            const returnOrder = await ReturnedProductOrder.findOne({ where: { id: returnId }, transaction });
            if (!returnOrder) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: "Return order not found"
                });
            }

            if (returnOrder.refundStatus === 'refunded') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Refund is already completed"
                });
            }

            if (returnOrder.returnStatus !== 'accepted' || returnOrder.pickupStatus !== 'completed') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Refund can only be processed if return order is accepted and pickup status is completed"
                });
            }

            returnOrder.refundStatus = refundStatus;
            await returnOrder.save({ transaction });

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: "Refund status updated successfully",
                data: {
                    id: returnOrder.id,
                    orderId: returnOrder.orderId,
                    orderItemId: returnOrder.orderItemId,
                    refundStatus: returnOrder.refundStatus
                }
            });

        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({
                success: false,
                message: "Failed to update refund status"
            });
        }
    },

}

module.exports = ReturnedProductOrderController;
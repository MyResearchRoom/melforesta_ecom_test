const { where, Op, } = require("sequelize");
const { User, CustomerAddresses, Category, Product, ProductImage, ProductOrder, ProductOrderItem, Pincode,ProductOrderStatusHistory, OrderShipmentDetails, CancelledProductOrder, ReturnedProductOrder, ProductReview, ProductVariant, Cart, PaymentTransaction,
    Coupon,
    CouponCategory,
    CouponProduct,
    CouponVariant,
    CouponUsages,sequelize } = require("../models");
const generateOrderId = require("../utils/generateOrderId");
const { razorpayInstance } = require("../config/rozorpay");
const crypto = require("crypto");
const { validateCoupon } = require("../services/couponService");

//create product order and calculate amount.. In this data inserted in prouctOrder and ProductOrderItemds table, ProductOrderStatusHistory 
    async function createOrder({
        userId,
        addressId,
        paymentMethod,
        items,
        transaction,
        paymentStatus="pending",
        couponCode=null,
        paymentId = null,
        razorpayOrderId = null,
       
    }) {

            if(!addressId || !paymentMethod){
                // return res.status(400).json({ success: false, message: "adress and payemnt method is required" });
                throw new Error("adress and payemnt method is required");
            }

            const address = await CustomerAddresses.findOne({
                where: { id: addressId, userId },
                transaction
            });

            if (!address) {
                // return res.status(404).json({
                //     success: false,
                //     message: "Invalid address"
                // });
                throw new Error("Invalid address");

            }

            if (!items || items.length === 0) {
                // return res.status(400).json({ success: false, message: "Cart is empty" });
                throw new Error("Cqart is empty");
            }

            const orderId = await generateOrderId();

            let totalItems = 0;
            let subTotal = 0;
            let discountAmount = 0;
            let gstAmount = 0;
            let handlingCharges = 0;

            const orderItemsData = [];

            for (const item of items) {
                const product = await Product.findByPk(item.productId, { transaction });
                if (!product) {
                    // return res.status(404).json({
                    //     success: false,
                    //     message: "Product not found"
                    // });
                    throw new Error("Product not found");
                }

                const variant = await ProductVariant.findByPk(item.variantId, { transaction });
                if (!variant) {
                    // return res.status(404).json({
                    //     success: false,
                    //     message: "Product variant not found"
                    // });
                    throw new Error("Product variant not found");
                }

                if (variant.currentAvailableStock < item.quantity) {
                    // return res.status(400).json({
                    //     success: false,
                    //     message: `Insufficient stock for ${product.productName} ${variant.name} variant`
                    // });
                    throw new Error(`Insufficient stock for ${product.productName} ${variant.name} variant`);
                }

                const originalPrice = parseFloat(variant.price) || 0;
                const discountPercent = parseFloat(variant.discountPercent) || 0;
                const gstPercent = parseFloat(product.gstPercent) || 0;
                const handling = parseFloat(product.handlingCharges) || 0;

                const itemSubTotal = originalPrice * item.quantity;

                const itemDiscount = (originalPrice * (discountPercent / 100)) * item.quantity;

                const discountedPrice = originalPrice - (originalPrice * discountPercent / 100);

                const itemGst = (discountedPrice * gstPercent / 100) * item.quantity;

                const itemHandling = handling * item.quantity;

                const perItemDiscount = originalPrice * (discountPercent / 100);
                const itemPrice = originalPrice;
                const itemTotalPrice = (originalPrice - perItemDiscount) * item.quantity;
                const productItemTotalPrice = itemTotalPrice + itemGst + itemHandling;

                totalItems += item.quantity;
                subTotal += itemSubTotal;
                discountAmount += itemDiscount;
                gstAmount += itemGst;
                handlingCharges += itemHandling;

                orderItemsData.push({
                    orderId,
                    productId: product.id,
                    variantId:variant.id,
                    quantity: item.quantity,
                    price: itemPrice,
                    discount: perItemDiscount,
                    totalPrice: productItemTotalPrice,
                });

                await ProductVariant.update(
                    {
                        currentAvailableStock: sequelize.literal(`currentAvailableStock - ${item.quantity}`)
                    },
                    {
                        where: {
                        id: variant.id,
                        currentAvailableStock: { [Op.gte]: item.quantity } 
                        },
                        transaction
                    }
                    );
            }

            let couponDiscount = 0;
            let couponId = null;
            let couponCodeResult = null;

            if (couponCode) {
                const couponResult = await validateCoupon({
                    userId,
                    couponCode
                });
                // console.log("couponResult",couponResult);
                

                couponDiscount = couponResult.discount;
                couponId = couponResult.coupon.id;
                couponCodeResult = couponResult.coupon.code;
            }


            let totalAmount =parseFloat(subTotal) + parseFloat(gstAmount) - parseFloat(discountAmount) - parseFloat(couponDiscount);

            // console.log("totalAmount",totalAmount);
            // console.log("subTotal",subTotal);
            // console.log("gstAmount",gstAmount);
            // console.log("discountAmount",discountAmount);
            // console.log("couponDiscount",couponDiscount);
            

            if (parseFloat(subTotal) < 1000) {
                totalAmount += parseFloat(handlingCharges);
            } else{
                handlingCharges = 0;
            }

            // console.log("totalAmount",totalAmount);
            // console.log("handlingCharges",handlingCharges);


            const order = await ProductOrder.create(
                {
                    orderId,
                    userId,
                    addressId,
                    paymentMethod,
                    totalItems,
                    subTotal,
                    discountAmount,
                    gstAmount,
                    handlingCharges,
                    totalAmount,
                    paymentId:paymentId ? paymentId : null,
                    razorpayOrderId : razorpayOrderId ? razorpayOrderId :null,
                    paymentStatus:paymentStatus,
                    couponId,
                    couponAmount: couponDiscount,
                    couponCode : couponCodeResult,
                },
                { transaction }
            );

            if (couponCode) {
                await CouponUsages.create({
                    couponId,
                    userId,
                    orderId : order.id,
                    discountAmount:couponDiscount,
                },
                { transaction }
                );
            }

            await ProductOrderStatusHistory.create(
                {
                    orderId: order.orderId,
                    status: "newRequest",
                    changedAt: new Date(),
                },
                { transaction }
            );


            await ProductOrderItem.bulkCreate(orderItemsData, { transaction });

            const createdOrder = await ProductOrder.findOne({
                where: { orderId },
                include: [{ model: ProductOrderItem, as: "items" }],
                transaction
            });

            await Cart.destroy({
                where: {
                    userId,
                    productId: items.map(i => i.productId),
                    variantId: items.map(i => i.variantId)
                },
                transaction
            });

            // await transaction.commit();

            return createdOrder;
    };

const ProductOrderController = {
    //for COD product order
    async placeOrder(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const { addressId, paymentMethod, items, couponCode } = req.body;
        console.log("couponCode",couponCode);
        
        try {
            //call creteOrder to place product order
            const order = await createOrder({
                userId: userId,
                addressId: addressId,
                paymentMethod: "cod",
                items: items,
                transaction,
                paymentStatus: 'pending',
                couponCode,
            });

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: order
            });

        } catch(err){

            await transaction.rollback();
            console.log(err);

            res.status(500).json({
                success:false,
                message: err.message
            });
        }
    },

    async createRazorpayOrder(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const userId = req.user.id;

            const { amount,addressId, paymentMethod, items, couponCode} = req.body;
  
            

            if (!amount || amount <= 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Valid amount is required",
                });
            }

            const productOrder = await createOrder({
                userId,
                addressId,
                paymentMethod,
                items,
                transaction,
                paymentStatus: 'pending',
                couponCode,
            });

            // console.log("productOrder.totalAmount",productOrder.totalAmount);
            // console.log("amount",amount);

            const options = {
                amount: Math.round(productOrder.totalAmount * 100), 
                currency: "INR",
                receipt: `order_${productOrder.orderId}`,
            };

            const order = await razorpayInstance.orders.create(options);

            await PaymentTransaction.create({
                orderId: productOrder.orderId,
                userId: userId,
                razorpayOrderId: order.id,
                amount:productOrder.totalAmount,
                paymentStatus: 'pending'
            }, { transaction });

            await transaction.commit();

            return res.status(200).json({
                success: true,
                orderId: productOrder.orderId,
                razorpayOrder: order
            });

        } catch (error) {
            console.error(error);

            await transaction.rollback();

            res.status(500).json({
                success: false,
                message: "Unable to create Razorpay order",
            });
        }
    },

    async verifyPayment (req, res) {
        const transaction = await sequelize.transaction();
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                productOrderId,
            } = req.body;

            const generatedSignature = crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    razorpay_order_id + "|" + razorpay_payment_id
                )
                .digest("hex");

           const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
        //    console.log("Payment method of rozorpay",payment.method);
           
           if(!payment){
                return res.status(400).json({
                    success: false,
                    message: "Payment verification failed",
                });
           }


            if (generatedSignature !== razorpay_signature) {

                await ProductOrder.update(
                {
                    paymentStatus: 'failed',
                    paymentMethod: payment.method,
                },
                { where: {orderId: productOrderId},
                    transaction
                });

                await PaymentTransaction.update(
                    {
                        paymentStatus: 'failed'
                    },
                    {
                        where: {
                            razorpayOrderId: razorpay_order_id
                        },
                        transaction
                });

                await transaction.commit();


                return res.status(400).json({
                    success: false,
                    message: "Payment verification failed",
                });
            }

            await ProductOrder.update(
            {
                paymentStatus: 'paid',
                paymentId: razorpay_payment_id,
                razorpayOrderId:razorpay_order_id,
                paymentMethod: payment.method,
            },
            {
                where: {orderId: productOrderId},
                transaction
            });

            await PaymentTransaction.update(
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paymentStatus: 'success',
                failureReason: null,
                paidAt: new Date(),
            },
            {
                where: {
                    razorpayOrderId: razorpay_order_id
                },
                transaction
            });

            await transaction.commit();

            
            res.status(200).json({
                success: true,
                message: "Payment verified successfully and Order placed successfully",
                // data:order,
            });

        } catch (error) {
            console.error(error);
            await transaction.rollback();

            res.status(500).json({
                success: false,
                message: "Payment Verification failed",
            });
        }
    },

    async paymentFailed (req, res) {
        const transaction = await sequelize.transaction();

        try {
            const {
                orderId,
                razorpay_order_id,
                razorpay_payment_id,
                reason,
            } = req.body;

            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            // console.log("Payment description of rozorpay",payment.description);
            
            if(!payment){
                    return res.status(400).json({
                        success: false,
                        message: "Order or Payment Transaction not found",
                    });
            }

            const [paymentUpdated] = await PaymentTransaction.update(
                {
                    razorpayPaymentId: razorpay_payment_id || null,

                    paymentStatus: "failed",

                    failureReason: reason || "Payment failed",

                },
                {
                    where: {
                        razorpayOrderId: razorpay_order_id,
                    },
                    transaction,
                }
            );

            const [orderUpdated] = await ProductOrder.update(
                {
                    paymentStatus: "failed",
                    paymentMethod: payment.method,
                },
                {
                    where: {
                        orderId: orderId,
                    },
                    transaction,
                }
            );

            if (!paymentUpdated || !orderUpdated) {
                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message:
                        "Order or Payment Transaction not found",
                });
            }

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: "Payment failure recorded successfully",
            });

        } catch (error) {

            await transaction.rollback();

            console.error(
                "Payment Failure Update Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update payment status",
                error: error.message,
            });
        }
    },

    // async placeOrder(req, res) {
    //     let transaction;
    //     try {
    //         transaction = await sequelize.transaction();
    //         const userId = req.user.id;
    //         const { addressId, paymentMethod, items } = req.body;

    //         if(!addressId || !paymentMethod){
    //             return res.status(400).json({ success: false, message: "adress and payemnt method is required" });
    //         }

    //         const address = await CustomerAddresses.findOne({
    //             where: { id: addressId, userId },
    //             transaction
    //         });

    //         if (!address) {
    //             await transaction.rollback();
    //             return res.status(404).json({
    //                 success: false,
    //                 message: "Invalid address"
    //             });
    //         }

    //         if (!items || items.length === 0) {
    //             return res.status(400).json({ success: false, message: "Cart is empty" });
    //         }

    //         const orderId = await generateOrderId();

    //         let totalItems = 0;
    //         let subTotal = 0;
    //         let discountAmount = 0;
    //         let gstAmount = 0;
    //         let handlingCharges = 0;

    //         const orderItemsData = [];

    //         for (const item of items) {
    //             const product = await Product.findByPk(item.productId, { transaction });
    //             if (!product) {
    //                 await transaction.rollback();
    //                 return res.status(404).json({
    //                     success: false,
    //                     message: "Product not found"
    //                 });
    //             }

    //             const variant = await ProductVariant.findByPk(item.variantId, { transaction });
    //             if (!variant) {
    //                 await transaction.rollback();
    //                 return res.status(404).json({
    //                     success: false,
    //                     message: "Product variant not found"
    //                 });
    //             }

    //             if (variant.currentAvailableStock < item.quantity) {
    //                 await transaction.rollback();
    //                 return res.status(400).json({
    //                     success: false,
    //                     message: `Insufficient stock for ${product.productName} ${variant.name} variant`
    //                 });
    //             }

    //             const originalPrice = parseFloat(variant.price) || 0;
    //             const discountPercent = parseFloat(variant.discountPercent) || 0;
    //             const gstPercent = parseFloat(product.gstPercent) || 0;
    //             const handling = parseFloat(product.handlingCharges) || 0;

    //             const itemSubTotal = originalPrice * item.quantity;

    //             const itemDiscount = (originalPrice * (discountPercent / 100)) * item.quantity;

    //             const discountedPrice = originalPrice - (originalPrice * discountPercent / 100);

    //             const itemGst = (discountedPrice * gstPercent / 100) * item.quantity;

    //             const itemHandling = handling * item.quantity;

    //             const perItemDiscount = originalPrice * (discountPercent / 100);
    //             const itemPrice = originalPrice;
    //             const itemTotalPrice = (originalPrice - perItemDiscount) * item.quantity;
    //             const productItemTotalPrice = itemTotalPrice + itemGst + itemHandling;

    //             totalItems += item.quantity;
    //             subTotal += itemSubTotal;
    //             discountAmount += itemDiscount;
    //             gstAmount += itemGst;
    //             handlingCharges += itemHandling;

    //             orderItemsData.push({
    //                 orderId,
    //                 productId: product.id,
    //                 variantId:variant.id,
    //                 quantity: item.quantity,
    //                 price: itemPrice,
    //                 discount: perItemDiscount,
    //                 totalPrice: productItemTotalPrice,
    //             });

    //             await ProductVariant.update(
    //                 {
    //                     currentAvailableStock: sequelize.literal(`currentAvailableStock - ${item.quantity}`)
    //                 },
    //                 {
    //                     where: {
    //                     id: variant.id,
    //                     currentAvailableStock: { [Op.gte]: item.quantity } 
    //                     },
    //                     transaction
    //                 }
    //                 );
    //         }

    //         const totalAmount = parseFloat(subTotal) - parseFloat(discountAmount) + parseFloat(gstAmount) + parseFloat(handlingCharges);

    //         const order = await ProductOrder.create(
    //             {
    //                 orderId,
    //                 userId,
    //                 addressId,
    //                 paymentMethod,
    //                 totalItems,
    //                 subTotal,
    //                 discountAmount,
    //                 gstAmount,
    //                 handlingCharges,
    //                 totalAmount
    //             },
    //             { transaction }
    //         );

    //         await ProductOrderStatusHistory.create(
    //             {
    //                 orderId: order.orderId,
    //                 status: "newRequest",
    //                 changedAt: new Date(),
    //             },
    //             { transaction }
    //         );


    //         await ProductOrderItem.bulkCreate(orderItemsData, { transaction });

    //         const createdOrder = await ProductOrder.findOne({
    //             where: { orderId },
    //             include: [{ model: ProductOrderItem, as: "items" }],
    //             transaction
    //         });

    //         await Cart.destroy({
    //             where: {
    //                 userId,
    //                 productId: items.map(i => i.productId),
    //                 variantId: items.map(i => i.variantId)
    //             },
    //             transaction
    //         });

    //         await transaction.commit();

    //         return res.status(201).json({
    //             success: true,
    //             message: "Order placed successfully",
    //             data: createdOrder
    //         });
    //     } catch (error) {
    //         if (transaction) await transaction.rollback();
    //         console.log(error);
            
    //         return res.status(500).json({
    //             success: false,
    //             message: "Failed to place order",
    //         });
    //     }
    // },

    async retryPayment(req, res) {
        try {

            const { orderId } = req.params;

            const order = await ProductOrder.findOne({
                where: {
                    orderId,
                    userId: req.user.id
                }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (order.paymentStatus === 'success') {
                return res.status(400).json({
                    success: false,
                    message: "Payment already completed"
                });
            }

            const options = {
                // amount: Number(order.totalAmount) * 100,
                amount: Math.round(Number(order.totalAmount) * 100), 
                currency: "INR",
                receipt: `order_${orderId}`,
            };

            const razorpayOrder = await razorpayInstance.orders.create(options);

            // create new transaction for existing orderId
            await PaymentTransaction.create({
                orderId: order.orderId,
                userId: req.user.id,
                razorpayOrderId: razorpayOrder.id,
                amount: order.totalAmount,
                paymentStatus: 'pending',
            });

            return res.status(200).json({
                success: true,
                orderId: order.orderId,
                razorpayOrder,
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Failed to retry payment"
            });
        }
    },

    async getAllOrders(req, res) {
        try {

            const { page = 1, limit = 10, status } = req.query;
            const offset = (page - 1) * limit;
            let whereCondition = {};

            if (status) {
                whereCondition.status = status;
            }

            const { rows: orders, count: totalRecords } = await ProductOrder.findAndCountAll({
                where: whereCondition,
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            });

            return res.status(200).json({
                success: true,
                message: "Orders fetched successfully",
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: orders
            });
        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to get orders"
            });
        }
    },
    

    async getOrderDetailsById(req, res) {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                return res.status(404).json({
                    success: false,
                    message: "Order Id is required"
                });
            }

            const order = await ProductOrder.findOne({
                where: { orderId },
                include: [
                    {
                        model: User,
                        as: "user",
                        attributes: ["id", "name", "email", "mobileNumber"]
                    },
                    {
                        model: CustomerAddresses,
                        as: "address",
                        attributes: [
                            "id", "flatNo", "buildingBlock", "floor", "buildingName",
                            "streetName", "landmark", "city", "state", "pincode"
                        ]
                    },
                    {
                        model: ProductOrderItem,
                        as: "items",
                        attributes: ["id", "quantity", "price", "discount", "productId","variantId","totalPrice"],
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "productName","gstPercent", "handlingCharges","description"
                                ],
                                include: [
                                    {
                                        model: ProductImage,
                                        as: "images",
                                        attributes: ["id", "image", "imageContentType"],
                                    },
                                    {
                                        model: Category,
                                        as: "category",
                                        attributes: ["id", "name"]
                                    }
                                ]
                            },
                            {
                                model:ProductVariant,
                                as:"variant",
                            }
                        ]
                    },
                    {
                        model: OrderShipmentDetails,
                        as: "shipment",
                        attributes: [
                            "trackingId", "estimatedDeliveryDate", "courierCompanyName", "pickupDate","deliveryPersonName","deliveryPersonContact","deliveryType",
                        ]
                    }
                ]
            });

            let orderHistory;

            if(order.status){
                orderHistory = await ProductOrderStatusHistory.findOne({
                    where: { 
                        orderId: order.orderId , 
                        status: order.status
                    },
                    order: [["changedAt", "ASC"]]
                });
            }

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            const orderData = order.toJSON();

            const userId = orderData.userId;
            const userReviews = await ProductReview.findAll({
                where: { userId }
            });

            const reviewedProductIds = new Set(userReviews.map(r => r.productId));

            const cancelledItems = await CancelledProductOrder.findAll({
                where: { orderId },
                attributes: ["orderItemId"]
            });

            const returnedItems = await ReturnedProductOrder.findAll({
                where: { orderId },
                attributes: ["orderItemId"]
            });

            const cancelledItemIds = cancelledItems.map(ci => Number(ci.orderItemId));
            const returnedItemIds = returnedItems.map(ri => Number(ri.orderItemId));

            const activeItems = orderData.items.filter(item => !cancelledItemIds.includes(Number(item.id)));
            if (activeItems.length === 0 && order.status !== 'cancelled') {
                await ProductOrder.update(
                    { status: 'cancelled' },
                    { where: { orderId } }
                );
                orderData.status = 'cancelled';
            }

            
            orderData.items = activeItems.map(item => {
                const alreadyReviewed = reviewedProductIds.has(item.productId);

                if (item.product?.images) {
                    item.product.images = item.product.images.map(img =>
                        img.image
                            ? `data:${img.imageContentType};base64,${img.image.toString('base64')}`
                            : null
                    );
                }

                return {
                    ...item,
                    isCancelled: false,
                    isReturned: returnedItemIds.includes(Number(item.id)),
                    product: {
                        ...item.product,
                        canReview: !alreadyReviewed
                    }
                };
            });

            const subTotal = orderData.items.reduce((sum, item) => {
                return sum + (parseFloat(item.price) * item.quantity);
            }, 0);

            const discountAmount = orderData.items.reduce((sum, item) => {
                return sum + (parseFloat(item.discount) * item.quantity);
            }, 0);

            const gstAmount = order.gstAmount;
            const handlingCharges = order.handlingCharges;  

            // const totalAmount =
            //     parseFloat(subTotal) -
            //     parseFloat(discountAmount) +
            //     parseFloat(order.gstAmount || 0) +
            //     parseFloat(order.handlingCharges || 0);

            const totalAmount = order.totalAmount;

            orderData.subTotal = subTotal.toFixed(2);
            orderData.discountAmount = discountAmount.toFixed(2);
            orderData.gstAmount = gstAmount;
            orderData.handlingCharges = handlingCharges;
            orderData.totalAmount = totalAmount;

            const customerAddPincode = orderData?.address?.pincode;

            if (customerAddPincode) {

                const pincodeData = await Pincode.findOne({
                    where: { pinCode: customerAddPincode }
                });

                if (pincodeData?.deliveryDays) {

                    const estimatedDate = new Date();

                    estimatedDate.setDate(
                        estimatedDate.getDate() + Number(pincodeData.deliveryDays)
                    );

                    orderData.estimatedDeliveryDate =
                        estimatedDate.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        });

                } else {
                    orderData.estimatedDeliveryDate = null;
                }
            } else {
                orderData.estimatedDeliveryDate = null;
            }

            if(orderHistory){
                orderData.deliveryDate=orderHistory.changedAt;
            }

            return res.status(200).json({
                success: true,
                message: "Order details fetched successfully",
                data: orderData
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch order details"
            });
        }
    },

    //get particular customer's order
    async getCustomersOrders(req, res) {
        try {
            const userId = req.user.id
            const { status } = req.query;
            let whereCondition = { userId };

            if (status) {
                whereCondition.status = status;
            }

            const orders = await ProductOrder.findAll({
                where: whereCondition,
                include: [
                    {
                        model: ProductOrderItem,
                        as: "items",
                        separate: true, 
                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "productName","description"],
                                include: [
                                    {
                                        model: ProductImage,
                                        as: "images",
                                        attributes: ["id", "image", "imageContentType"],
                                        limit: 1,
                                        separate: true, 
                                    }
                                ]
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            const formattedOrders = orders.map(order => {
                const orderData = order.toJSON();
                orderData.items = orderData.items.map(item => {
                    if (item.product && item.product.images) {
                        item.product.images = item.product.images.slice(0, 1).map(img => ({
                            id: img.id,
                            image: img.image
                                ? `data:${img.imageContentType};base64,${img.image.toString("base64")}`
                                : null
                        }));
                    }
                    return item;
                });
                return orderData;
            });


            return res.status(200).json({
                success: true,
                message: "Orders fetched successfully",
                data: formattedOrders
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to get orders"
            });
        }
    },

    //new 
    async changeOrderStatus(req, res) {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                return res.status(404).json({
                    success: false,
                    message: "Order Id is required"
                });
            }

            const order = await ProductOrder.findOne({ where: { orderId } });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (order.status === "delivered" || order.status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    message: `Cannot change status from ${order.status}`
                });
            }

            let newStatus;

            if (order.status === "newRequest") {
                newStatus = "processing";
            } else if (order.status === "processing") {
                const shipment = await OrderShipmentDetails.findOne({ where: { orderId } });
                if (!shipment) {
                    return res.status(400).json({
                        success: false,
                        message: "Shipping details must be submitted before marking as shipped"
                    });
                }
                newStatus = "shipped";
            } else if (order.status === "shipped") {
                newStatus = "outForDelivery";
            } else if (order.status === "outForDelivery") {
                newStatus = "delivered";
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Order cannot be updated"
                });
            }

            order.status = newStatus;
            if(order.paymentMethod === "cod" && newStatus === "delivered"){
                order.paymentStatus = "paid";
            }
            await order.save();

            await ProductOrderStatusHistory.create({
                orderId: order.orderId,
                status: newStatus,
                changedAt: new Date(),
            });

            return res.status(200).json({
                success: true,
                message: `Order status updated to ${newStatus}`
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to change order status"
            });
        }
    },

    async submitShippingDetails(req, res) {
        try {
            const { orderId } = req.params;
            const {
                deliveryType,
                courierCompanyName,
                trackingId,
                deliveryPersonName,
                deliveryPersonContact,
                pickupDate,
                estimatedDeliveryDate,                    
                paymentMode,
                boxWeight,
                pickupLocation,
            } = req.body;

            const order = await ProductOrder.findOne({ where: { orderId } });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (order.status !== "processing") {
                return res.status(400).json({
                    success: false,
                    message: "Order is not in processing state",
                });
            }

            const existingShipment = await OrderShipmentDetails.findOne({ where: { orderId } });
            if (existingShipment) {
                return res.status(400).json({
                    success: false,
                    message: "Shipment details already submitted for this order",
                });
            }

            const shipment = await OrderShipmentDetails.create({
                orderId,
                deliveryType,
                courierCompanyName: deliveryType ==="courier" ? courierCompanyName : null,
                trackingId: deliveryType ==="courier" ? trackingId : null,
                deliveryPersonName: deliveryType ==="manual" ? deliveryPersonName : null,
                deliveryPersonContact: deliveryType ==="manual" ? deliveryPersonContact : null,
                pickupDate,
                estimatedDeliveryDate,
                paymentMode: order.paymentMethod,
                boxWeight,
                pickupLocation,
                deliveryAddress: order.addressId,
            });

            order.status = "shipped";
            await order.save();

            await ProductOrderStatusHistory.create({
                orderId: order.orderId,
                status: "shipped",
                changedAt: new Date(),
            });

            return res.status(200).json({
                success: true,
                message: "Shipping details submitted successfully, order status updated to shipped",
                data: shipment
            });

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to submit shipping details",
            });
        }
    },

    async getProductOrderStatusHistory(req, res) {
        try {
            const { orderId } = req.params;

            const order = await ProductOrder.findOne({ where: { orderId } });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            const history = await ProductOrderStatusHistory.findAll({
                where: { orderId },
                order: [["changedAt", "ASC"]],
            });

            return res.status(200).json({
                success: true,
                message: "Order Status history fetched successfully.",
                orderId: order.orderId,
                currentStatus: order.status,
                history,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch order status history",
            });
        }
    },

    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                return res.status(404).json({
                    success: false,
                    message: "Order Id is required"
                });
            }

            const order = await ProductOrder.findOne({
                where: { orderId }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (["shipped", "outForDelivery", "delivered", "cancelled"].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot cancel order with status ${order.status}`
                });
            }

            order.status = "cancelled";
            await order.save();

            const orderItems = await ProductOrderItem.findAll({ where: { orderId } });
            for (const item of orderItems) {
                await Product.increment(
                    { totalStock: item.quantity },
                    { where: { id: item.productId } }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Order cancelled successfully",
                data: order
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to cancel order"
            });
        }
    },

    async getPaymentTransactions (req, res) {
        try {

            const {
                page = 1,
                limit = 10,
                search = "",
                paymentStatus,
                startDate,
                endDate,
            } = req.query;

            const offset = (page - 1) * limit;

            const whereCondition = {};

            if (paymentStatus) {
                whereCondition.paymentStatus = paymentStatus;
            }

            if (startDate && endDate) {
                whereCondition.createdAt = {
                    [Op.between]: [
                        new Date(startDate),
                        new Date(endDate),
                    ],
                };
            }

            if (search) {
                whereCondition[Op.or] = [
                    {
                        orderId: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        razorpayOrderId: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        razorpayPaymentId: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    
                    {
                        "$user.name$": {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        "$user.email$": {
                            [Op.like]: `%${search}%`,
                        },
                    },
                ];
            }

            const { count, rows } =
                await PaymentTransaction.findAndCountAll({
                    where: whereCondition,

                    include: [
                        {
                            model: ProductOrder,
                            as: "order",
                            attributes: [
                                "id",
                                "orderId",
                                "paymentMethod",
                                "paymentStatus",
                                "createdAt",
                            ],
                        },
                        {
                            model: User,
                            as: "user",
                            attributes: [
                                "id",
                                "name",
                                "email",
                                "mobileNumber"
                            ],
                        },
                    ],
                    distinct: true,
                    order: [["createdAt", "DESC"]],

                    limit: parseInt(limit),

                    offset,
                    
                });

            return res.status(200).json({
                success: true,
                message: "Payment transactions fetched successfully",

                data: rows,

                totalRecords: count,

                currentPage: Number(page),

                totalPages: Math.ceil(
                        count / limit
                ),
  
            });

        } catch (error) {

            console.error(
                "Get Payment Transactions Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch payment transactions",
            });
        }
    },

};

module.exports = ProductOrderController;

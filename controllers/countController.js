const { Op, Sequelize, where } = require("sequelize");
const { User, Category, Product, ProductOrder, CancelledProductOrder, ReturnedProductOrder,Enquiry,BulkOrder,Pincode,Coupon,CouponVariant,CouponUsages, } = require("../models");

const CountController = {

    async getCounts(req, res) {
        try {

            //general counts
            const totalCustomers = await User.count({ where: { role: "CUSTOMER" } })
            const totalStaffs = await User.count({
                where: { role: { [Op.in]: ["PRODUCT_MANAGER","DELIVERY_ASSOCIATE"] } }
            });
            const totalCategories = await Category.count();

            //products count
            const totalProducts = await Product.count();
           
            const totalNewRequests = await ProductOrder.count({ where: { status: "newRequest" } });
            const totalProcessing = await ProductOrder.count({ where: { status: "processing" } });
            const totalShipped = await ProductOrder.count({ where: { status: "shipped" } });
            const totalOutForDelivery = await ProductOrder.count({ where: { status: "outForDelivery" } });
            const totalDelivered = await ProductOrder.count({ where: { status: "delivered" } });
            const totalCancelledProcess = await ProductOrder.count({ where: { status: "cancelled" } });

            const totalCancelled = await CancelledProductOrder.count();
            const totalReturned = await ReturnedProductOrder.count();

            //Enquiry 
            const totalEnquiries = await Enquiry.count();
            const totalBulkOrderEnquiries = await BulkOrder.count();

            //pincode
            const totalPincodes = await Pincode.count();

            //coupons
            const totalCoupons = await Coupon.count();
            const totalActiveCoupons = await Coupon.count({
                where: {
                    isActive: true,
                },
            });
            const totalInactiveCoupons = await Coupon.count({
                where: {
                    isActive: false,
                },
            });
            const now = new Date();

            const next1Day = new Date();
            next1Day.setDate(next1Day.getDate() + 1);

            const expiringSoonCoupons = await Coupon.count({
            where: {
                isActive: true,
                endDate: {
                [Op.between]: [now, next1Day],
                },
            },
            });
            const totalUsedCoupon = await CouponUsages.count();


            return res.status(200).json({
                success: true,
                message: "Counts fetched successfully.",
                data: {
                    totalCustomers,
                    totalStaffs,
                    totalCategories,

                    totalProducts,
                    totalNewRequests,
                    totalProcessing,
                    totalShipped,
                    totalOutForDelivery,
                    totalDelivered,
                    totalCancelledProcess,
                    
                    totalCancelled,
                    totalReturned,

                    totalEnquiries,
                    totalBulkOrderEnquiries,

                    totalPincodes,

                    totalCoupons,
                    totalActiveCoupons,
                    totalInactiveCoupons,
                    expiringSoonCoupons,
                    totalUsedCoupon,

                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to get counts",
            });
        }
    },

}

module.exports = CountController
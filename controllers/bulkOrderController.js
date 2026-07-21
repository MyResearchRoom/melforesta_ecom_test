const { BulkOrder } = require("../models")

const BulkOrderController = {

    async addBulkOrder(req, res) {
        try {
            const { companyName, contactName, email, phone, orderType,quantity, details } = req.body;

            const bulkOrder = await BulkOrder.create({
                companyName:companyName || null, 
                contactName, 
                email, 
                phone, 
                orderType,
                quantity, 
                details :details || null,
            });

            return res.status(200).json({
                success: true,
                message: "Your message submitted successfully",
                data: bulkOrder
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to submit form"
            })
        }
    },

    async getBulkOrders(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const { rows: bulkOrders, count: totalRecords } = await BulkOrder.findAndCountAll({
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            return res.status(200).json({
                success: true,
                message: "Bulk Orders fetched successfully",
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: bulkOrders,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch bulk orders",
            });
        }
    },

}

module.exports = BulkOrderController;
const { Enquiry } = require("../models")

const EnquiryController = {

    async createEnquiry(req, res) {
        try {
            const { name, email, mobileNumber, message } = req.body;

            if (!name || !email || !mobileNumber || !message) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }

            const enquiry = await Enquiry.create({
                name,
                email,
                mobileNumber,
                message
            });

            return res.status(200).json({
                success: true,
                message: "Form submitted successfully",
                data: enquiry
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to submit form"
            })
        }
    },

    async getEnquiries(req, res) {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const offset = (page - 1) * limit;

            let whereCondition = {};
            if (search) {
                const { Op } = require("sequelize");
                whereCondition = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                    ],
                };
            }

            const { rows: enquiries, count: totalRecords } = await Enquiry.findAndCountAll({
                where: whereCondition,
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            return res.status(200).json({
                success: true,
                message: "Enquiries fetched successfully",
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                data: enquiries,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch enquiries",
            });
        }
    },

    async deleteEnquiry(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(404).json({
                    success: false,
                    message: "Id is required"
                })
            }
            const enquiry = await Enquiry.findByPk(id);
            if (!enquiry) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found"
                });
            }

            await enquiry.destroy();

            return res.status(200).json({
                success: true,
                message: "Enquiry deleted successfully"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete enquiry"
            });
        }
    },

}

module.exports = EnquiryController;
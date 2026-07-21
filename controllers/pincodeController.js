const { Op } = require("sequelize");
const { Pincode} = require("../models")

const PincodeController = {

    async addPincodes(req, res) {
        try {
            const { pinCode, district, state, city ,deliveryDays} = req.body;

            if (!pinCode || !district || !state || !city) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
            }

            const existingPincode = await Pincode.findOne({
            where: { pinCode },
            });

            if (existingPincode) {
            return res.status(400).json({
                success: false,
                message: "Pincode already exists",
            });
            }

            const newPincode = await Pincode.create({
                pinCode,
                district,
                state,
                city,
                deliveryDays
            });

            return res.status(201).json({
                success: true,
                message: "Pincode added successfully",
                data: newPincode,
            });

        } catch (error) {
            console.log("Add pincode error:", error);

            return res.status(500).json({
            success: false,
            message: "Failed to add pincode",
            error: error.message,
            });
        }
    },

    async getPincodeList(req, res) {
        try {
            const { page = 1, limit = 10, search = "" } = req.query;

            const parsedPage = parseInt(page, 10);
            const parsedLimit = parseInt(limit, 10);
            const offset = (parsedPage - 1) * parsedLimit;

            let whereCondition = {};

            if (search) {
            whereCondition[Op.or] = [
                { pinCode: { [Op.like]: `%${search}%` } },
                { district: { [Op.like]: `%${search}%` } },
                { state: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } },
            ];
            }

            const { rows, count } = await Pincode.findAndCountAll({
                where: whereCondition,
                order: [["createdAt", "DESC"]],
                limit: parsedLimit,
                offset: offset,
                distinct: true,
            });

            return res.status(200).json({
                success: true,
                message: "Pincode list fetched successfully",
                currentPage: parsedPage,
                totalPages: Math.ceil(count / parsedLimit),
                totalRecords: count, 
                data: rows,
            });

        } catch (error) {
            console.log("Fetch pincode error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch pincode list",
                error: error.message,
            });
        }
    },

    async getPincodeById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
            return res.status(400).json({
                success: false,
                message: "Pincode id is required",
            });
            }

            const pincode = await Pincode.findByPk(id);

            if (!pincode) {
            return res.status(404).json({
                success: false,
                message: "Pincode not found",
            });
            }

            return res.status(200).json({
                success: true,
                message: "Pincode fetched successfully",
                data: pincode,
            });

        } catch (error) {
            console.log("Get pincode error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch pincode",
                error: error.message,
            });
        }
    },

    async updatePincode(req, res) {
        try {
            const { id } = req.params;
            const { pinCode, district, state, city, deliveryDays } = req.body;

            if (!id) {
            return res.status(400).json({
                success: false,
                message: "Pincode id is required",
            });
            }

            const existingPincode = await Pincode.findByPk(id);

            if (!existingPincode) {
            return res.status(404).json({
                success: false,
                message: "Pincode not found",
            });
            }

            if (pinCode && pinCode !== existingPincode.pinCode) {
            const duplicate = await Pincode.findOne({
                where: { pinCode },
            });

            if (duplicate) {
                return res.status(400).json({
                success: false,
                message: "Pincode already exists",
                });
            }
            }


            await existingPincode.update({
                pinCode: pinCode || existingPincode.pinCode,
                district: district || existingPincode.district,
                state: state || existingPincode.state,
                city: city || existingPincode.city,
                deliveryDays :deliveryDays || existingPincode.deliveryDays,
            });

            return res.status(200).json({
            success: true,
            message: "Pincode updated successfully",
            data: existingPincode,
            });

        } catch (error) {
            console.log("Update pincode error:", error);

            return res.status(500).json({
            success: false,
            message: "Failed to update pincode",
            error: error.message,
            });
        }
    },

    async checkPincodeExists(req, res) {
        try {
            const { pinCode } = req.params;

            if (!pinCode) {
            return res.status(400).json({
                success: false,
                message: "Pincode is required",
            });
            }

            const existingPincode = await Pincode.findOne({
            where: { pinCode },
            });

            if (!existingPincode) {
            return res.status(200).json({
                success: false,
                exists: false,
                message: "Your selected pincode not serviceable",
            });
            }

            return res.status(200).json({
                success: true,
                exists: true,
                message: "Pincode is serviceable",
                data: existingPincode,
            });

        } catch (error) {
            console.log("Check pincode error:", error);

            return res.status(500).json({
            success: false,
            message: "Failed to check pincode",
            error: error.message,
            });
        }
    },

    async deletePincode(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
            return res.status(400).json({
                success: false,
                message: "Pincode id is required",
            });
            }

            const existingPincode = await Pincode.findByPk(id);

            if (!existingPincode) {
            return res.status(404).json({
                success: false,
                message: "Pincode not found",
            });
            }

            await existingPincode.destroy();

            return res.status(200).json({
            success: true,
            message: "Pincode deleted successfully",
            });

        } catch (error) {
            console.log("Delete pincode error:", error);

            return res.status(500).json({
            success: false,
            message: "Failed to delete pincode",
            error: error.message,
            });
        }
    },

    async checkDeliveryAvailability(req, res) {
        try {
            const { pinCode } = req.body;

            if (!pinCode) {
                return res.status(400).json({
                    success: false,
                    message: "Pincode is required"
                });
            }

            const pincodeData = await Pincode.findOne({
                where: { pinCode }
            });

            if (!pincodeData) {
                return res.status(404).json({
                    success: false,
                    serviceable: false,
                    message: "Sorry, delivery is not available for this pincode."
                });
            }

            // Calculate estimated delivery date
            const today = new Date();

            const estimatedDate = new Date();
            estimatedDate.setDate(
                today.getDate() + pincodeData.deliveryDays
            );

            const formattedDate = estimatedDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            return res.status(200).json({
                success: true,
                serviceable: true,
                message: `Delivery available in ${pincodeData.city}`,
                data: {
                    pinCode: pincodeData.pinCode,
                    city: pincodeData.city,
                    district: pincodeData.district,
                    state: pincodeData.state,
                    deliveryDays: pincodeData.deliveryDays,
                    estimatedDeliveryDate: formattedDate,
                }
            });

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to check delivery availability"
            });
        }
    },

}

module.exports = PincodeController;
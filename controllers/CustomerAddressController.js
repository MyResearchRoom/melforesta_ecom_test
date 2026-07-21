const { where } = require("sequelize");
const { CustomerAddresses } = require("../models");

const CustomerAddressesController = {

    async addAddress(req, res) {
        try {
            const userId = req.user.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User Id is required"
                });
            }
            const {
                flatNo,
                buildingBlock,
                floor,
                buildingName,
                streetName,
                landmark,
                city,
                state,
                pincode
            } = req.body

            if (!flatNo || !buildingName || !city || !state || !pincode) {
                return res.status(400).json({
                    success: false,
                    message: "Please fill the required fields"
                })
            }

            const address = await CustomerAddresses.create({
                userId,
                flatNo,
                buildingBlock,
                floor,
                buildingName,
                streetName,
                landmark,
                city,
                state,
                pincode
            });

            return res.status(200).json({
                success: true,
                message: "Address added successfully",
                data: address
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to add address"
            })
        }
    },

    async editAddress(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Address ID is required"
                });
            }

            const {
                flatNo,
                buildingBlock,
                floor,
                buildingName,
                streetName,
                landmark,
                city,
                state,
                pincode
            } = req.body;

            if (!flatNo || !buildingName || !city || !state || !pincode) {
                return res.status(400).json({
                    success: false,
                    message: "Please fill the required fields"
                });
            }

            const address = await CustomerAddresses.findOne({
                where: { id, userId }
            });

            if (!address) {
                return res.status(404).json({
                    success: false,
                    message: "Address not found"
                });
            }

            await address.update({
                flatNo,
                buildingBlock,
                floor,
                buildingName,
                streetName,
                landmark,
                city,
                state,
                pincode
            });

            return res.status(200).json({
                success: true,
                message: "Address updated successfully",
                data: address
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to update address"
            });
        }
    },

    async getAddresses(req, res) {
        try {
            const userId = req.user.id;

            const addresses = await CustomerAddresses.findAll({
                where: { userId }
            });

            return res.status(200).json({
                success: true,
                message: "Addresses fetched successfully",
                data: addresses
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch addresses"
            });;
        }
    },

    async getAddressById(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "Address Id is required"
                });
            }

            const address = await CustomerAddresses.findOne({
                where: { id, userId }
            });

            if (!address) {
                return res.status(404).json({
                    success: false,
                    message: "Address not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Address fetched successfully",
                data: address
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch address"
            });
        }
    },

    async deleteAddress(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            if (!id) {
                return res.status(404).json({
                    success: false,
                    message: "Id is required"
                });
            }

            const address = await CustomerAddresses.findOne({
                where: { id, userId }
            });

            if (!address) {
                return res.status(404).json({
                    success: false,
                    message: "Address not found"
                });
            }

            await address.destroy();

            return res.status(200).json({
                success: true,
                message: "Address deleted successfully"
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete address"
            })
        }
    }
}

module.exports = CustomerAddressesController
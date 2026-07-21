const { Op } = require("sequelize");
const { Category } = require("../models")

const categoryController = {

    async createCategory(req, res) {
        try {
            const { name, isBlock } = req.body;
            // console.log("name",name);


            const existingCategory = await Category.findOne({
                where: { name }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category already exists"
                });
            }

            const newCategory = await Category.create({
                name,
                isBlock: isBlock !== undefined ? isBlock : false,
            });

            return res.status(200).json({
                success: true,
                message: "Category created successfully",
                data: {
                    id: newCategory.id,
                    name: newCategory.name,
                },
            })
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to create category"
            })
        }
    },
    //without limit=all
    // async getCategoryList(req, res) {
    //     try {

    //         const { page = 1, limit = 10, search } = req.query;
    //         const offset = (page - 1) * limit;

    //         const whereCondition = {};
    //         if (search) {
    //             whereCondition.name = { [Op.like]: `%${search}%` };
    //         }

    //         const { rows: categories, count: totalRecords } = await Category.findAndCountAll({
    //             where: whereCondition,
    //             attributes: ["id", "name", "isBlock"],
    //             order: [["createdAt", "DESC"]],
    //             limit: parseInt(limit, 10),
    //             offset: parseInt(offset, 10)
    //         });

    //         const categoryList = categories.map(category => ({
    //             id: category.id,
    //             name: category.name,
    //             isBlock: category.isBlock,
    //         }));

    //         return res.status(200).json({
    //             success: true,
    //             message: "Category list fetched successfully",
    //             currentPage: parseInt(page, 10),
    //             totalPages: Math.ceil(totalRecords / 10),
    //             totalRecords,
    //             data: categoryList
    //         });
    //     } catch (error) {
    //         console.log(error);

    //         return res.status(500).json({
    //             success: false,
    //             message: "Failed to fecth category list"
    //         });
    //     }
    // },

    async getCategoryList(req, res) {
        try {
            let { page = 1, limit = 10, search } = req.query;

            const whereCondition = {};

            if (search) {
                whereCondition.name = { [Op.like]: `%${search}%` };
            }

            let queryOptions = {
                where: whereCondition,
                attributes: ["id", "name", "isBlock"],
                order: [["createdAt", "DESC"]],
            };

            if (limit !== "all" && limit !== "All") {
                limit = parseInt(limit, 10) || 10;
                page = parseInt(page, 10) || 1;

                queryOptions.limit = limit;
                queryOptions.offset = (page - 1) * limit;
            }

            const { rows: categories, count: totalRecords } =
                await Category.findAndCountAll(queryOptions);
            // console.log("Raw Categories:", categories);

            // categories.forEach((cat) => {
            //     console.log("Category Name:", cat.name);
            // });
            const categoryList = categories.map(category => ({

                id: category.id,
                name: category.name,
                isBlock: category.isBlock,
            }));

            return res.status(200).json({
                success: true,
                message: "Category list fetched successfully",
                currentPage: limit === "all" || limit === "All" ? 1 : page,
                totalPages:
                    limit === "all" || limit === "All"
                        ? 1
                        : Math.ceil(totalRecords / limit),
                totalRecords,
                data: categoryList,
            });

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch category list",
            });
        }
    },

    async getCategoryDetailsById(req, res) {
        try {
            const { id } = req.params;

            const category = await Category.findOne({
                where: { id },
                attributes: ["id", "name", "isBlock",]
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }

            const categoryData = {
                id: category.id,
                name: category.name,
                isBlock: category.isBlock,
            };

            return res.status(200).json({
                success: true,
                message: "Category details fetched successfully",
                data: categoryData
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch category details"
            });
        }
    },

    async editCategory(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const { name, isBlock } = req.body;
            // console.log("req.body data",name,isBlock);

            const category = await Category.findByPk(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }

            category.name = name || category.name;
            category.isBlock = isBlock !== undefined ? isBlock : category.isBlock;


            await category.save();

            return res.status(200).json({
                success: true,
                message: "Category updated successfully",
                data: {
                    id: category.id,
                    name: category.name,
                    isBlock: category.isBlock,
                },
            });
        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to update category"
            });
        }
    },

    async blockCategory(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const category = await Category.findByPk(id)
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found"
                });
            }

            category.isBlock = !category.isBlock;
            await category.save();

            return res.status(200).json({
                success: true,
                message: `Category ${category.isBlock ? "blocked" : "unblocked"} successfully`,
                data: {
                    id: category.id,
                    name: category.name,
                    isBlock: category.isBlock
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to block/unblock category"
            });
        }
    },

    async deleteCategory(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ success: false, message: "Id is required" });
            }

            const category = await Category.findByPk(id)
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: "Category not found"
                });
            }

            await category.destroy();

            return res.status(200).json({
                success: true,
                message: "Category deleted successfully"
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete category"
            });
        }
    },
}

module.exports = categoryController;
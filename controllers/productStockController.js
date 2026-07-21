const { Op, where } = require("sequelize");
const { Category, Product, ProductStock, ProductStockDocument,ProductVariant, sequelize } = require("../models");
const generateStockId = require("../utils/generateStockId");

const ProductStockController = {

    async addStock(req, res) {
        try {
            const {
                categoryId,
                productId,
                supplierName,
                lowStockThreshold,
                restockQuantity,
                pricePerUnit,
                restockDate,
                variantId,
            } = req.body;

            if (!categoryId || !productId || !supplierName || !lowStockThreshold || !restockQuantity || !pricePerUnit || !restockDate || !variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Please fill the required fields"
                })
            }

            const latestStock = await ProductStock.findOne({
                where: { productId },
                order: [["createdAt", "DESC"]],
            });

            // const previousStock = latestStock ? latestStock.currentStock : 0;
            const currentStock = Number(restockQuantity);
            const totalPrice = currentStock * Number(pricePerUnit);

            const stockId = await generateStockId();

            const stock = await ProductStock.create({
                stockId,
                categoryId,
                productId,
                supplierName,
                // currentStock,
                lowStockThreshold,
                restockQuantity,
                productVariant:variantId,
                pricePerUnit,
                totalPrice,
                restockDate,
                
            });

            // const totalStock = await ProductStock.sum('currentStock', { where: { productId } });

            // await ProductVariant.update(
            //     { totalStock: totalStock || 0 },
            //     { where: { id: productId } }
            // );

            const variant = await ProductVariant.findByPk(variantId);

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: "Product variant not found",
                });
            }

            await variant.update({
                currentAvailableStock: variant.currentAvailableStock + currentStock,
                totalStock: variant.totalStock + currentStock,
            });


            if (req.files && req.files.documents) {
                if (req.files.documents.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: "You can upload a maximum of 5 documents only",
                    });
                }

                const documentsData = req.files.documents.map((file) => ({
                    stockId: stock.id,
                    document: file.buffer,
                    documentContentType: file.mimetype,
                    documentName: file.originalname
                }));

                if (documentsData.length) await ProductStockDocument.bulkCreate(documentsData);
            }

            return res.status(200).json({
                success: true,
                message: "Stock added successfully",
                data: stock,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to add stock"
            });
        }
    },

    //new api search with category name
    async getStockList(req, res) {
        try {
            const { page = 1, limit = 10, search = "",status } = req.query;
            const offset = (page - 1) * limit;

            const latestStocksRaw = await ProductStock.findAll({
                attributes: [
                    [sequelize.fn("MAX", sequelize.col("createdAt")), "latestStockCreated"],
                    "productId",
                    "productVariant",
                ],
                group: ["productId","productVariant"],
                raw: true,
            });

            const latestConditions = latestStocksRaw.map((s) => ({
                productId: s.productId,
                productVariant: s.productVariant,
                createdAt: s.latestStockCreated,
            }));         

            const searchCondition = search
                ? {
                    [Op.or]: [
                        sequelize.where(
                            sequelize.col("product.productName"),
                            { [Op.like]: `%${search}%` }
                        ),
                        sequelize.where(
                            sequelize.col("category.name"),
                            { [Op.like]: `%${search}%` }
                        ),
                    ],
                }
                : {};

            let statusCondition = {};
            if (status === "inStock") {
                statusCondition = {
                    "$varient.currentAvailableStock$": {
                        [Op.gt]: sequelize.col("ProductStock.lowStockThreshold"),
                    }
                };
            } 
            else if (status === "lowStock") {
                statusCondition = {
                    [Op.and]: [
                        {
                            "$varient.currentAvailableStock$": {
                                [Op.gt]: 0
                            }
                        },
                        {
                            "$varient.currentAvailableStock$": {
                                [Op.lte]: sequelize.col("ProductStock.lowStockThreshold")
                            }
                        }
                    ]
                };
            } 
            else if (status === "outOfStock") {
                statusCondition = {
                    "$varient.currentAvailableStock$": 0
                };
            }

            const totalRecords = await ProductStock.count({
                where: {
                    [Op.or]: latestConditions,
                    ...searchCondition,
                    ...statusCondition
                },
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: [],
                    },
                    {
                        model: Category,
                        as: "category",
                        attributes: [],
                    },
                    {
                        model: ProductVariant,
                        as: "varient",
                        attributes: [],
                    }
                ],
                distinct: true,
                col: "id"
            });

            const stocks = await ProductStock.findAll({
                where: {
                    [Op.or]: latestConditions,
                    ...searchCondition,
                    ...statusCondition
                },
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: ["id", "productName"],
                    },
                    {
                        model: Category,
                        as: "category",
                        attributes: ["id", "name"],
                    },
                    {
                        model: ProductVariant,
                        as: "varient",
                        attributes: ["id", "weight","currentAvailableStock","totalStock"],
                    },
                ],
                order: [["createdAt", "DESC"]],
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            });

            const stocksWithStatus = stocks.map(stock => {
                let status = "inStock";
                if (stock.varient.currentAvailableStock === 0) status = "outOfStock";
                else if (stock.varient.currentAvailableStock <= stock.lowStockThreshold) status = "lowStock";

                return {
                    id: stock.id,
                    productId: stock.productId,
                    productName: stock.product?.productName,
                    categoryName: stock.category?.name,
                    variantId:stock.varient?.id,
                    weight:stock.varient?.weight,
                    // currentStock: stock.currentStock,
                    availableStock: stock.varient?.currentAvailableStock,
                    totalStock: stock.varient?.totalStock,
                    lowStockThreshold: stock.lowStockThreshold,
                    restockQuantity: stock.restockQuantity,
                    restockDate: stock.restockDate,
                    status,
                };
            });

            // return res.status(200).json({
            //     success: true,
            //     message: "Stock list fetched successfully",
            //     currentPage: parseInt(page, 10),
            //     totalRecords: stocks.length,
            //     totalPages: Math.ceil(stocks.length / limit),
            //     data: stocksWithStatus,
            // });
            return res.status(200).json({
                success: true,
                message: "Stock list fetched successfully",
                currentPage: parseInt(page, 10),
                totalRecords,
                totalPages: Math.ceil(totalRecords / parseInt(limit, 10)), 
                data: stocksWithStatus,
            });
        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch stock list",
            });
        }
    },

    async getStockDetailsById(req, res) {
        try {
            const { productId, variantId } = req.params;
            let { page = 1, limit = 10 } = req.query;

            const parsedPage = parseInt(page, 10);
            const parsedLimit = parseInt(limit, 10);
            const offset = (parsedPage - 1) * parsedLimit;

            if (!productId) {
                return res.status(400).json({ success: false, message: "Product Id is required" });
            }

            const { rows, count } = await ProductStock.findAndCountAll({
                where: { 
                    productId,
                    productVariant: variantId
                },
                include: [
                    {
                        model: Product,
                        as: "product",
                        attributes: ["id", "productName"]
                    },
                    {
                        model: Category,
                        as: "category",
                        attributes: ["id", "name"]
                    },
                     {
                        model: ProductVariant,
                        as: "varient",
                        attributes: ["id", "weight","currentAvailableStock","totalStock"],
                    },
                    {
                        model: ProductStockDocument,
                        as: "documents",
                        attributes: ["id", "document", "documentName", "documentContentType"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: parsedLimit,
                offset: offset,
            });

            if (!rows || rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No stock history found for this product"
                });
            }
            // console.log("rows",rows);
            // console.log("count:", count);
            

            const latestStock = rows[0];

            const stockDetails = rows.map(stock => {
                const currentStock = Number(stock.currentStock);
                const lowStockThreshold = Number(stock.lowStockThreshold);

                let status = "inStock";
                if (currentStock === 0) status = "outOfStock";
                else if (currentStock <= lowStockThreshold) status = "lowStock";

                const documents = stock.documents.map(doc => ({
                    id: doc.id,
                    documentName: doc.documentName,
                    document: doc.document
                        ? `data:${doc.documentContentType};base64,${doc.document.toString("base64")}`
                        : null
                }));

                return {
                    ...stock.toJSON(),
                    documents,
                    status,
                    // latestCurrentStock: latestStock.currentStock,
                    // totalStock: stock.product ? stock.product.totalStock : null,
                };
            });

            // console.log("rows.length:", rows.length);
            // console.log("stockDetails.length:", stockDetails.length);

            return res.status(200).json({
                success: true,
                message: "Stock details fetched successfully",
                data: stockDetails,
                currentPage: parsedPage,
                totalPages: Math.ceil(count / parsedLimit),
                totalRecords: count, 
            });

        } catch (error) {
            console.log(error);
            
            return res.status(500).json({
                success: false,
                message: "Failed to fetch stock details"
            });
        }
    },

    async getTotalStockByProduct(req, res) {
        try {
            const { productId, variantId } = req.params;

            if (!productId || !variantId) {
                return res.status(400).json({
                    success: false,
                    message: "Product ID and Variant ID are required",
                });
            }

            const product = await Product.findByPk(productId, {
                attributes: ["id", "productName"],
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            const variant = await ProductVariant.findOne({
                where: {
                    id: variantId,
                    productId: productId,
                },
                attributes: [
                    "id",
                    "weight",
                    "totalStock",
                    "currentAvailableStock",
                ],
            });

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: "Product variant not found",
                });
            }

            const latestStock = await ProductStock.findOne({
                where: {
                    productId,
                    productVariant:variantId,
                },
                order: [["createdAt", "DESC"]],
                attributes: ["lowStockThreshold", "restockDate"],
            });

            const lowStockThreshold = latestStock?.lowStockThreshold || 0;

            return res.status(200).json({
                success: true,
                message: "Stock fetched successfully",
                data: {
                    productId: product.id,
                    productName: product.productName,

                    totalStock: variant.currentAvailableStock,

                    lowStockThreshold,
                },
            });

        } catch (error) {
            console.error("Error fetching stock:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch stock",
            });
        }
    },

    async getStockDocuments(req, res) {
        try {
            const { stockId } = req.params;

            const stock = await ProductStock.findOne({
                where: { id: stockId },
                include: [
                    {
                        model: ProductStockDocument,
                        as: "documents",
                        attributes: ["id", "document", "documentName", "documentContentType", "createdAt"],
                    },
                ],
            });

            if (!stock || stock.documents.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No documents found for this stock",
                });
            }

            const documents = stock.documents.map(doc => ({
                id: doc.id,
                documentName: doc.documentName,
                document: doc.document
                    ? `data:${doc.documentContentType};base64,${doc.document.toString("base64")}`
                    : null,
                documentContentType: doc.documentContentType,
                createdAt: doc.createdAt,
            }));

            return res.status(200).json({
                success: true,
                message: "Documents fetched successfully",
                data: documents,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch documents"
            });
        }
    },

    async deleteStock(req, res) {
        try {
            const { stockId } = req.params;

            if (!stockId) {
                return res.status(400).json({ success: false, message: "Stock Id is required" });
            }

            const stock = await ProductStock.findOne({
                where: { stockId },
                include: [{ model: ProductStockDocument, as: "documents" }]
            });

            if (!stock) {
                return res.status(404).json({
                    success: false,
                    message: "Stock not found"
                });
            }

            if (stock.documents && stock.documents.length > 0) {
                await ProductStockDocument.destroy({
                    where: { stockId: stock.id }
                });
            }
            await ProductStock.destroy({
                where: { stockId }
            });

            return res.status(200).json({
                success: true,
                message: "Stock deleted successfully"
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete stock"
            });
        }
    },
};

module.exports = ProductStockController;

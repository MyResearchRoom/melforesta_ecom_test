const { ProductStock } = require("../models");

async function generateStockId() {
    const lastStock = await ProductStock.findOne({
        order: [["id", "DESC"]],
    });

    let nextNumber = 1;

    if (lastStock && lastStock.stockId) {
        const match = lastStock.stockId.match(/\d+$/);
        if (match) {
            nextNumber = parseInt(match[0], 10) + 1;
        }
    }

    return `STK${String(nextNumber).padStart(4, "0")}`;
}

module.exports = generateStockId;


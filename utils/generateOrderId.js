const { ProductOrder } = require("../models")

async function generateOrderId() {
    const lastOrder = await ProductOrder.findOne({
        order: [["id", "DESC"]],
    });

    let nextNumber = 1;

    if (lastOrder && lastOrder.id) {
        nextNumber = lastOrder.id + 1;
    }

    return `ORD${String(nextNumber).padStart(4, "0")}`;
}

module.exports = generateOrderId;
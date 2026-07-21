const { ServiceInvoice } = require("../models")

async function generateInvoiceNumber() {
    const lastInvoiceNumber = await ServiceInvoice.findOne({
        order: [["id", "DESC"]],
    });

    let nextNumber = 1;

    if (lastInvoiceNumber && lastInvoiceNumber.id) {
        nextNumber = lastInvoiceNumber.id + 1;
    }

    return `INV${String(nextNumber).padStart(4, "0")}`;
}

module.exports = generateInvoiceNumber;
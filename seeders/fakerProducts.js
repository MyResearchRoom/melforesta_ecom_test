const { faker } = require("@faker-js/faker");

const {
  Product,
  ProductVariant,
} = require("../models");

const sequelize = require("../config/db");
const db = require("../models");


const honeyTypes = [
  "Jamun Honey",
  "Tulsi Honey",
  "Neem Honey",
  "Wild Forest Honey",
  "Mustard Honey",
  "Lychee Honey",
  "Acacia Honey",
];

async function seedProducts() {
//   const transaction = await sequelize.transaction();

  try {
    for (let i = 0; i < 100; i++) {

      const product = await Product.create(
        {
          productName:
            honeyTypes[
              Math.floor(Math.random() * honeyTypes.length)
            ] + " " + i,

          categoryId: faker.number.int({
            min: 1,
            max: 6,
          }),

          description: faker.commerce.productDescription(),

          gstPercent: 18,

          handlingCharges: faker.number.int({
            min: 5,
            max: 20,
          }),

          specifications: [
            {
              key: "Weight",
              value: faker.helpers.arrayElement([
                "250 g",
                "500 g",
                "1 kg",
              ]),
            },
            {
              key: "Origin",
              value: faker.location.state(),
            },
          ],

          isBlock: false,
        },
        {}
      );

      const variants = [
        {
          productId: product.id,
          weight: "250 gram",
          price: faker.number.int({
            min: 200,
            max: 400,
          }),
          discountPercent: faker.number.int({
            min: 0,
            max: 10,
          }),
        },

        {
          productId: product.id,
          weight: "500 gram",
          price: faker.number.int({
            min: 400,
            max: 800,
          }),
          discountPercent: faker.number.int({
            min: 0,
            max: 15,
          }),
        },
      ];

      const formattedVariants = variants.map((v) => ({
        ...v,

        discountedPrice: (
          v.price -
          (v.price * v.discountPercent) / 100
        ).toFixed(2),
      }));

      await ProductVariant.bulkCreate(
        formattedVariants,
        {}
      );

      console.log(
        `Created Product ${i + 1}`
      );
    }

    // await transaction.commit();

    console.log(
      "All fake products inserted successfully"
    );

    process.exit();

  } catch (error) {

    // await transaction.rollback();

    console.log(error);

    process.exit(1);
  }
}

seedProducts();
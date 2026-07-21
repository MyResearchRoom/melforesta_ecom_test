const fs = require("fs");
const path = require("path");

const db = require("../models");

const Product = db.Product;
const ProductImage = db.ProductImage;

const imageFiles = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
];

async function replaceImages() {
  try {

    const products = await Product.findAll();

    for (const product of products) {

      // DELETE old images
      await ProductImage.destroy({
        where: {
          productId: product.id
        }
      });

      // CREATE new images
      const imagesData = imageFiles.map((fileName) => {

        const imageBuffer = fs.readFileSync(
          path.join(
            __dirname,
            "images",
            fileName
          )
        );

        return {
          productId: product.id,
          image: imageBuffer,
          imageContentType: "image/png",
        };
      });

      await ProductImage.bulkCreate(imagesData);

      console.log(
        `Replaced images for Product ${product.id}`
      );
    }

    console.log(
      "All product images replaced successfully"
    );

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit(1);
  }
}

replaceImages();
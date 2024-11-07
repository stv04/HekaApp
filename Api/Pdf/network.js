const { readFileSync } = require("fs");
const { join } = require("path");
exports.getBase64Image = imageName => {

    const realPath = join(__dirname, "images", imageName)
    const imageData = readFileSync(realPath);

    const dataBase64 = Buffer.from(imageData, 'binary').toString('base64');
    const contentType = "image/png";
    const imageBase64 = `data:${contentType};base64,${dataBase64}`;

    return imageBase64;
}
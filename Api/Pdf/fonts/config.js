const path = require("path");

exports.fontDescriptors = {
    Roboto: {
        normal: path.join(__dirname, 'Roboto-Regular.ttf'),
        bold: path.join(__dirname, 'Roboto-Medium.ttf'),
        italics: path.join(__dirname, 'Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, 'Roboto-MediumItalic.ttf')
    }
};
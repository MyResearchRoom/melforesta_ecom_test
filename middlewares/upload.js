const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
});

const uploadFiles = (fields) => {
    return upload.fields(fields);
};

module.exports = {
    upload,
    uploadFiles,
};

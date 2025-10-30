const multer = require("multer");
const path = require("path");
const fs = require("fs");

// تأكد إن مجلد uploads موجود
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// إعداد التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `attachment_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

// فلترة الملفات (اختياري)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("نوع الملف غير مسموح به"), false);
  }
  cb(null, true);
};

// إنشاء الـ uploader
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // حد أقصى 10MB
});

module.exports = upload;

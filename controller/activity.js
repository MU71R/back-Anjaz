const activitymodel = require("../model/activity");
const { getIo } = require("../socket");
const Notification = require("../model/notifications");
const path = require("path");
const { formatEgyptTime } = require("../utils/getEgyptTime");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs-extra");
const moment = require("moment");
const PdfPrinter = require("pdfmake");
const dayjs = require("dayjs");
const localizedFormat = require("dayjs/plugin/localizedFormat");
require("dayjs/locale/ar"); // دعم اللغة العربية
dayjs.extend(localizedFormat);
require("moment/locale/ar");

moment.locale("ar");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
} = require("docx");
// puppeteer تم الحذف - لم يعد مستخدما

const addactivity = async (req, res) => {
  try {
    const {
      activityTitle,
      activityDescription,
      MainCriteria,
      SubCriteria,
      name,
      SaveStatus,
    } = req.body;
    const attachments = req.files.map((file) => `/uploads/${file.filename}`);
    const newActivity = new activitymodel({
      user: req.user._id,
      activityTitle,
      activityDescription,
      MainCriteria,
      SubCriteria,
      SaveStatus,
      Attachments: attachments,
      name,
    });

    await newActivity.save();

    res.status(201).json({
      success: true,
      message: "تم إضافة النشاط بنجاح",
      activity: newActivity,
    });
  } catch (error) {
    console.error("خطأ في إضافة النشاط:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء الإضافة",
    });
  }
};

const getallactivities = async (req, res) => {
  try {
    // لو المستخدم مدير
    if (req.user.role === "admin") {
      const activities = await activitymodel
        .find()
        .populate("user", "fullname username role")
        .populate("MainCriteria", "name")
        .populate("SubCriteria", "name");

      return res.status(200).json({ success: true, activities });
    }

    //  لو المستخدم عادي (مش admin)
    const user = req.user._id;
    const activities = await activitymodel
      .find({ user })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");

    return res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("خطأ في جلب النشاطات:", error);
    return res
      .status(500)
      .json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};

const getActivityById = async (req, res) => {
  try {
    const activityId = req.params.id;
    const activity = await activitymodel
      .findById(activityId)
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error("خطأ في جلب النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};

// get draft by id activities
const getdraftActivitiesById = async (req, res) => {
  const activityId = req.params.id;
  try {
    const activities = await activitymodel
      .findById(activityId)
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    if (!activities) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("خطأ في جلب النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};

// delete draft activities
const deleteDraftActivities = async (req, res) => {
  try {
    const activityId = req.params.id;
    const activity = await activitymodel.findByIdAndDelete(activityId);
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    res.status(200).json({ success: true, message: "تم حذف النشاط", activity });
  } catch (error) {
    console.error("خطأ في حذف النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};

// update draft activities
const updateDraftActivities = async (req, res) => {
  try {
    const activityId = req.params.id;

    // البحث عن النشاط الحالي
    const currentActivity = await activitymodel.findById(activityId);
    if (!currentActivity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }

    // نبدأ بكائن تحديث فارغ
    const updates = {};

    // تحديث البيانات النصية لو موجودة
    const fields = [
      "activityTitle",
      "activityDescription",
      "MainCriteria",
      "SubCriteria",
      "name",
      "SaveStatus",
      "status",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // ✅ معالجة المرفقات المحذوفة
    let finalAttachments = [...currentActivity.Attachments];

    if (req.body.deletedAttachments) {
      const deletedAttachments = Array.isArray(req.body.deletedAttachments)
        ? req.body.deletedAttachments
        : [req.body.deletedAttachments];

      // حذف المرفقات المحذوفة من القائمة النهائية
      finalAttachments = finalAttachments.filter(
        (attachment) => !deletedAttachments.includes(attachment)
      );

      // ✅ حذف الملفات فعلياً من السيرفر
      for (const deletedAttachment of deletedAttachments) {
        try {
          const filePath = path.join(__dirname, "..", deletedAttachment);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ تم حذف الملف: ${deletedAttachment}`);
          }
        } catch (fileError) {
          console.error(`❌ خطأ في حذف الملف: ${deletedAttachment}`, fileError);
        }
      }
    }

    // ✅ معالجة المرفقات الجديدة
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(
        (file) => `/uploads/${file.filename}`
      );
      finalAttachments = [...finalAttachments, ...newAttachments];
    }

    // ✅ التحقق من عدم تجاوز الحد الأقصى للملفات
    const maxFiles = 2;
    if (finalAttachments.length > maxFiles) {
      // حذف الملفات الجديدة التي تم رفعها
      req.files.forEach((file) => {
        try {
          const filePath = path.join(__dirname, "../uploads", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(
            `❌ خطأ في حذف الملف الزائد: ${file.filename}`,
            fileError
          );
        }
      });

      return res.status(400).json({
        success: false,
        message: `لا يمكن رفع أكثر من ${maxFiles} ملفات`,
      });
    }

    // ✅ تحديث المرفقات النهائية
    updates.Attachments = finalAttachments;

    // ✅ تحديث النشاط
    const activity = await activitymodel
      .findByIdAndUpdate(activityId, updates, { new: true })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");

    console.log("📎 المرفقات النهائية:", finalAttachments);
    console.log("🔄 النشاط المحدث:", activity);

    res.status(200).json({
      success: true,
      message: "تم تحديث النشاط بنجاح",
      activity,
    });
  } catch (error) {
    console.error("❌ خطأ في تحديث النشاط:", error);

    // ✅ حذف الملفات الجديدة في حالة الخطأ
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        try {
          const filePath = path.join(__dirname, "../uploads", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(
            `❌ خطأ في حذف الملف بعد الخطأ: ${file.filename}`,
            fileError
          );
        }
      });
    }

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التحديث",
      error: error.message,
    });
  }
};
// file system
// ===== دوال مساعدة =====
async function getImageBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const contentType = response.headers['content-type'];
    if (contentType && contentType.startsWith('image/')) {
      return Buffer.from(response.data);
    }
    return null;
  } catch (err) {
    console.warn('فشل تحميل الصورة:', url);
    return null;
  }
}

function getUniqueFilePath(dir, baseName, ext) {
  let counter = 1;
  let filePath = path.join(dir, `${baseName}${ext}`);
  while (fs.existsSync(filePath)) {
    filePath = path.join(dir, `${baseName}_${counter++}${ext}`);
  }
  return filePath;
}

// تنسيق التاريخ بالعربية
const formatDate = (d) => {
  if (!d) return "غير محدد";
  return dayjs(d).locale("ar").format("D MMMM YYYY");
};

// دالة كتابة حقل مع wrap طبيعي
const writeField = (doc, label, value, pageW) => {
  const margin = 70;
  const maxWidth = pageW - margin * 2;
  doc.text(`${label}: ${value}`, margin, doc.y, {
    width: maxWidth,
    align: 'right',
    lineGap: 4,
    features: ['rtla'], // دعم RTL
  });
  doc.moveDown(0.5);
};

// ===== الكود الرئيسي =====
const generateAllActivitiesPDF = async (req, res) => {
 try {
    // 1. استخراج الفلاتر + التواريخ
    const { startDate, endDate, ...otherFilters } = req.query;
    const filters = {};

    // فلترة على الحقول العادية
    for (const [key, value] of Object.entries(otherFilters)) {
      if (value && value !== 'null' && value !== 'undefined') filters[key] = value;
    }

    // 2. فلترة التاريخ (اختياري)
    if (startDate) {
      if (endDate) {
        filters.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        const date = new Date(startDate);
        filters.date = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999))
        };
      }
    }

    // 3. تحميل الأنشطة
    const activities = await activitymodel
      .find(filters)
      .populate('user', 'fullname name role')
      .populate('MainCriteria', 'name')
      .populate('SubCriteria', 'name')
      .sort({ 'user.fullname': 1, createdAt: -1 });

    if (!activities.length) return res.status(404).json({ success: false, message: 'لا توجد أنشطة مطابقة' });

    // 4. وصف الفلترة
    let filterDescription = 'تقرير الأنشطة';
    for (const [key, value] of Object.entries(otherFilters)) {
      if (value) {
        let displayKey = '', displayValue = '';
        if (key === 'MainCriteria') displayValue = activities[0]?.MainCriteria?.name || value;
        else if (key === 'SubCriteria') displayValue = activities[0]?.SubCriteria?.name || value;
        else if (key === 'user') displayValue = activities[0]?.user?.fullname || value;
        else displayValue = value;

        displayKey = key === 'MainCriteria' ? 'المعيار الرئيسي' :
                     key === 'SubCriteria' ? 'المعيار الفرعي' :
                     key === 'user' ? 'المستخدم' : key;

        filterDescription += ` | ${displayKey}: ${displayValue}`;
      }
    }

    // إضافة وصف التاريخ لو موجود
    if (startDate && endDate) filterDescription += ` | من: ${startDate} إلى: ${endDate}`;
    else if (startDate) filterDescription += ` | بتاريخ: ${startDate}`;


    // 5. تجميع حسب المستخدم
    const groupedByUser = {};
    for (const activity of activities) {
      const userName = activity.user?.fullname || 'مستخدم غير معروف';
      if (!groupedByUser[userName]) groupedByUser[userName] = [];
      groupedByUser[userName].push(activity);
    }

    // 6. إعداد الموارد (الخط والشعار)
    const fontPath = path.join(__dirname, '../fonts/Amiri-Regular.ttf');
    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (!fs.existsSync(fontPath)) throw new Error('خط Amiri غير موجود!');
    const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

    const outputDir = path.join(__dirname, '../generated-files');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const pdfPath = getUniqueFilePath(outputDir, 'تقرير_الأنشطة', '.pdf');

    // 7. إنشاء PDF
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 70, right: 70 } });
    doc.registerFont('Amiri', fontPath);
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    const drawBorder = () => doc.save().lineWidth(2).strokeColor('#444').rect(20, 20, pageW - 40, pageH - 40).stroke().restore();

    // 8. صفحة الغلاف
    drawBorder();
    if (logoBuffer) {
      const imgW = 120;
      const startY = (pageH - imgW - 100) / 2;
      doc.image(logoBuffer, (pageW - imgW) / 2, startY, { width: imgW });
      doc.font('Amiri').fontSize(32).text('جامعة قنا', 0, startY + imgW + 70, { width: pageW, align: 'center', features: ['rtla'] });
    } else {
      doc.font('Amiri').fontSize(32).text('جامعة قنا', 0, pageH / 2 - 16, { width: pageW, align: 'center', features: ['rtla'] });
    }

    // 9. صفحة الفلترة
    doc.addPage(); drawBorder();
    doc.font('Amiri').fontSize(22).text(filterDescription, 0, pageH / 2 - 20, { width: pageW, align: 'center', features: ['rtla'] });

    // 10. صفحات المستخدمين والأنشطة
    for (const [userName, userActivities] of Object.entries(groupedByUser)) {
      doc.addPage(); drawBorder();
      doc.font('Amiri').fontSize(26).text(`أنشطة ${userName}`, 70, pageH / 2 - 30, { width: pageW - 140, align: 'center', features: ['rtla'] });

      for (let i = 0; i < userActivities.length; i++) {
        const activity = userActivities[i];
        doc.addPage(); drawBorder();

        const info = {
          title: activity.activityTitle || activity.title || '-',
          description: activity.activityDescription || activity.description || '-',
          mainCriteria: activity.MainCriteria?.name || '-',
          subCriteria: activity.SubCriteria?.name || '-',
          performer: activity.name || '-',
          date: formatDate(activity.date),
        };

        doc.font('Amiri').fontSize(18).text(`النشاط رقم ${i + 1}`, 0, 100, { width: pageW, align: 'center', features: ['rtla'] });
        doc.moveDown(2);

        writeField(doc, 'عنوان النشاط', info.title, pageW);
        writeField(doc, 'الوصف', info.description, pageW);
        writeField(doc, 'المعيار الرئيسي', info.mainCriteria, pageW);
        writeField(doc, 'المعيار الفرعي', info.subCriteria, pageW);
        writeField(doc, 'تاريخ النشاط', info.date, pageW);
        if (info.performer !== '-') writeField(doc, 'القائم بالنشاط', info.performer, pageW);

        // المرفقات
        if (activity.Attachments?.length) {
          doc.moveDown(1);
          doc.fontSize(14).fillColor('#1a5fb4').text('المرفقات:', 70, doc.y, { align: 'right', features: ['rtla'] });
          doc.moveDown(0.5);

          for (const link of activity.Attachments) {
            const fullUrl = link.startsWith('http') ? link : `${req.protocol}://${req.get('host')}${link}`;
            const ext = path.extname(fullUrl).toLowerCase();
            if (['.jpg','.jpeg','.png','.gif','.webp'].includes(ext)) {
              const imgBuffer = await getImageBuffer(fullUrl);
              if (imgBuffer) { try { doc.image(imgBuffer, { fit: [450, 300], align: 'center' }); doc.moveDown(0.6); continue; } catch {} }
            }
            doc.fillColor('#1a5fb4').fontSize(11).text(fullUrl, 70, doc.y, { width: pageW - 140, align: 'right', link: fullUrl, underline: true, features: ['rtla'] });
            doc.moveDown(0.3);
          }
        }
      }
    }

    // 11. إنهاء PDF
    doc.end();
    await new Promise((resolve, reject) => { pdfStream.on('finish', resolve); pdfStream.on('error', reject); });

    const pdfUrl = `${req.protocol}://${req.get('host')}/generated-files/${path.basename(pdfPath)}`;
    res.json({ success: true, message: 'تم إنشاء التقرير بنجاح', file: pdfUrl, count: activities.length });

  } catch (error) {
    console.error('خطأ في إنشاء التقرير:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء التقرير', error: error.message });
  }
};


const updateActivityStatus = async (req, res) => {
  // removed browser variable since puppeteer not used
  try {
    const activityId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["مرفوض", "قيد المراجعة", "معتمد"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "حالة غير صالحة" });
    }

    const activity = await activitymodel
      .findByIdAndUpdate(activityId, { status }, { new: true })
      .populate("user", "fullname name role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");

    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }

    const io = getIo();
    io.emit("updateActivity", activity);

    const notification = new Notification({
      message: `تم تحديث النشاط: ${activity.activityTitle}`,
      activity: activity._id,
    });
    await notification.save();

    return res.json({
      success: true,
      message: " تم  تحديث حالة النشاط الجامعي بنجاح",
      activity,
    });
  } catch (error) {
    console.error(" خطأ في إنشاء النشاط:", error.message);
    // لا يوجد متصفح لإغلاقه الآن
    res
      .status(500)
      .json({
        success: false,
        message: "خطأ أثناء إنشاء النشاط",
        error: error.message,
      });
  }
};

const updateActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const updates = req.body;
    const activity = await activitymodel.findByIdAndUpdate(
      activityId,
      updates,
      { new: true }
    );
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    await activity.save();
    res
      .status(200)
      .json({ success: true, message: "تم تحديث النشاط", activity });
  } catch (error) {
    console.error("خطأ في تحديث النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const deleteActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const activity = await activitymodel.findByIdAndDelete(activityId);
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    res.status(200).json({ success: true, message: "تم حذف النشاط", activity });
  } catch (error) {
    console.error("خطأ في حذف النشاط:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const getarchivedActivities = async (req, res) => {
  try {
    const archivedActivities = await activitymodel
      .find({ status: "معتمد" })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    res.status(200).json({ success: true, data: archivedActivities });
  } catch (error) {
    console.error("خطأ في جلب النشاطات المحفوظة:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const getdraftActivities = async (req, res) => {
  const user = req.user._id;
  try {
    const draftActivities = await activitymodel
      .find({ SaveStatus: "مسودة", user })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    if (!draftActivities) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    if (draftActivities.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "لا يوجد نشاطات مسودة" });
    }
    res.status(200).json({ success: true, data: draftActivities });
  } catch (error) {
    console.error("خطأ فى جلب المسودات", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const search = async (req, res) => {
  try {
    const { query } = req.query;
    const activities = await activitymodel
      .find()
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name")
      .find({
        $or: [
          { activityTitle: { $regex: query, $options: "i" } },
          { activityDescription: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { user: { $regex: query, $options: "i" } },
        ],
      });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error("خطأ في البحث عن النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};
const filterByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const activities = await activitymodel.find({ status: status });
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error("خطأ في تصفية النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
  }
};

// ===== Recent Achievements (Activities)
const recentAchievements = async (req, res) => {
  try {
    let query = {};

    //  لو المستخدم مش admin هنعرض بس إنجازاته هو
    if (req.user.role !== "admin") {
      query.user = req.user._id;
    }

    const achievements = await activitymodel
      .find(query)
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    const activities = achievements.map((a) => {
      const userName = a.user?.fullname || "مستخدم غير معروف";
      const mainCriteria = a.MainCriteria?.name;
      const subCriteria = a.SubCriteria?.name;
      const title = a.activityTitle || "بدون عنوان";
      const timeText = formatEgyptTime(a.createdAt);

      let criteriaText = "";
      if (mainCriteria && subCriteria)
        criteriaText = `ضمن المعيار "${mainCriteria}" - "${subCriteria}"`;
      else if (mainCriteria) criteriaText = `ضمن المعيار "${mainCriteria}"`;
      else if (subCriteria)
        criteriaText = `ضمن المعيار الفرعي "${subCriteria}"`;
      else criteriaText = "ضمن معيار لم يتم تحديده بعد";

      return {
        message: `تمت إضافة إنجاز جديد بواسطة: ${userName}\nعنوان: "${title}"\n${criteriaText}\n${timeText}`,
        time: timeText,
        id: a._id,
      };
    });

    res.status(200).json({ success: true, activities });
  } catch (err) {
    console.error("❌ Error fetching recent achievements:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحميل أحدث الإنجازات",
      error: err.message,
    });
  }
};

module.exports = {
  addactivity,
  getallactivities,
  getActivityById,
  updateActivityStatus,
  updateActivity,
  deleteActivity,
  getarchivedActivities,
  getdraftActivities,
  updateDraftActivities,
  deleteDraftActivities,
  getdraftActivitiesById,
  search,
  filterByStatus,
  recentAchievements,
  generateAllActivitiesPDF,
};

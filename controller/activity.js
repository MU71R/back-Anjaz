const activitymodel = require("../model/activity");
const { getIo } = require("../socket");
const Notification = require("../model/notifications");
const path = require("path");
const { formatEgyptTime } = require("../utils/getEgyptTime");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const { getImageBuffer, getUniqueFilePath, formatDate, writeField, reverseNumbersInString } = require("../utils/helperfunction");
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

    //  معالجة المرفقات المحذوفة
    let finalAttachments = [...currentActivity.Attachments];

    if (req.body.deletedAttachments) {
      const deletedAttachments = Array.isArray(req.body.deletedAttachments)
        ? req.body.deletedAttachments
        : [req.body.deletedAttachments];

      // حذف المرفقات المحذوفة من القائمة النهائية
      finalAttachments = finalAttachments.filter(
        (attachment) => !deletedAttachments.includes(attachment)
      );

      // حذف الملفات فعلياً من السيرفر
      for (const deletedAttachment of deletedAttachments) {
        try {
          const filePath = path.join(__dirname, "..", deletedAttachment);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(` تم حذف الملف: ${deletedAttachment}`);
          }
        } catch (fileError) {
          console.error(` خطأ في حذف الملف: ${deletedAttachment}`, fileError);
        }
      }
    }

    //  معالجة المرفقات الجديدة
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(
        (file) => `/uploads/${file.filename}`
      );
      finalAttachments = [...finalAttachments, ...newAttachments];
    }

    //  التحقق من عدم تجاوز الحد الأقصى للملفات
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
            ` خطأ في حذف الملف الزائد: ${file.filename}`,
            fileError
          );
        }
      });

      return res.status(400).json({
        success: false,
        message: `لا يمكن رفع أكثر من ${maxFiles} ملفات`,
      });
    }

    //  تحديث المرفقات النهائية
    updates.Attachments = finalAttachments;

    //  تحديث النشاط
    const activity = await activitymodel
      .findByIdAndUpdate(activityId, updates, { new: true })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");

    console.log(" المرفقات النهائية:", finalAttachments);
    console.log(" النشاط المحدث:", activity);

    res.status(200).json({
      success: true,
      message: "تم تحديث النشاط بنجاح",
      activity,
    });
  } catch (error) {
    console.error(" خطأ في تحديث النشاط:", error);

    // حذف الملفات الجديدة في حالة الخطأ
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        try {
          const filePath = path.join(__dirname, "../uploads", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(
            ` خطأ في حذف الملف بعد الخطأ: ${file.filename}`,
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

const generateAllActivitiesPDF = async (req, res) => {
  try {
    const { startDate, endDate, ...otherFilters } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ success: false, message: "تاريخ البداية وتاريخ النهاية مطلوبان." });

    const filters = {};
    for (const [key, value] of Object.entries(otherFilters))
      if (value && value !== "null" && value !== "undefined") filters[key] = value;

    filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const activities = await activitymodel
      .find(filters)
      .populate("user", "fullname name role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name")
      .sort({ "user.fullname": 1, createdAt: -1 });

    if (!activities.length)
      return res.status(404).json({ success: false, message: "لا توجد أنشطة مطابقة للفترة المحددة." });

    let filterDescription = "تقرير الأنشطة";
    for (const [key, value] of Object.entries(otherFilters)) {
      if (value) {
        let displayKey = "", displayValue = "";
        if (key === "MainCriteria") displayValue = activities[0]?.MainCriteria?.name || value;
        else if (key === "SubCriteria") displayValue = activities[0]?.SubCriteria?.name || value;
        else if (key === "user") displayValue = activities[0]?.user?.fullname || value;
        else displayValue = value;
        displayKey =
          key === "MainCriteria" ? "المعيار الرئيسي" :
          key === "SubCriteria" ? "المعيار الفرعي" :
          key === "user" ? "المستخدم" : key;
        filterDescription += ` | ${displayKey}: ${displayValue}`;
      }
    }
    filterDescription += `\nمن الفترة: ${formatDate(startDate)} - إلى: ${formatDate(endDate)}`;

    const groupedByUser = {};
    for (const a of activities) {
      const name = a.user?.fullname || "مستخدم غير معروف";
      if (!groupedByUser[name]) groupedByUser[name] = [];
      groupedByUser[name].push(a);
    }

    const fontPath = path.join(__dirname, "../fonts/Amiri-Regular.ttf");
    const logoPath = path.join(__dirname, "../assets/logo.png");
    const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;
    const outputDir = path.join(__dirname, "../generated-files");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const pdfPath = getUniqueFilePath(outputDir, "تقرير_الانجازات", ".pdf");

    const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 70, right: 70 } });
    doc.registerFont("Amiri", fontPath);
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);

    const pageW = doc.page.width, pageH = doc.page.height;
    const drawBorder = () => doc.save().lineWidth(2).strokeColor("#444").rect(20, 20, pageW - 40, pageH - 40).stroke().restore();

  drawBorder();
if (logoBuffer) {
  const imgW = 120, startY = (pageH - imgW - 100) / 2;
  doc.image(logoBuffer, (pageW - imgW) / 2, startY, { width: imgW });

  const title = `إنجازات جامعة قنا\n من الفترة: ${formatDate(startDate)} إلى: ${formatDate(endDate)}`;

  doc.font("Amiri")
    .fontSize(24)
    .text(title, 70, startY + imgW + 80, {
      width: pageW - 140,
      align: "center",
      features: ["rtla"],
    });
}


    doc.addPage();
    drawBorder();
    const margin = 40, innerWidth = pageW - margin * 2;
    doc.font("Amiri").fontSize(20).text(filterDescription, margin, pageH / 2 - 20, { width: innerWidth, align: "center", features: ["rtla"] });

    for (const [userName, userActivities] of Object.entries(groupedByUser)) {
      doc.addPage();
      drawBorder();
      doc.font("Amiri").fontSize(24).text(`أنشطة ${userName}`, 70, pageH / 2 - 30, { width: pageW - 140, align: "center", features: ["rtla"] });

      for (let i = 0; i < userActivities.length; i++) {
        const a = userActivities[i];
        doc.addPage(); drawBorder();

        const info = {
          title: a.activityTitle || a.title || "-",
          description: a.activityDescription || a.description || "-",
          mainCriteria: a.MainCriteria?.name || "-",
          subCriteria: a.SubCriteria?.name || "-",
          performer: a.name || "-",
          date: formatDate(a.date),
        };

        const activityNum = String(i + 1);
        doc.font("Amiri").fontSize(14).text(
          `الانجاز رقم ${reverseNumbersInString(activityNum).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d])}`,
          0, 100, { width: pageW, align: "center", features: ["rtla"] }
        );
        doc.moveDown(2);

        writeField(doc, "المعيار الرئيسي", info.mainCriteria, pageW);
        writeField(doc, "المعيار الفرعي", info.subCriteria, pageW);
        writeField(doc, "عنوان الانجاز", info.title, pageW);
        writeField(doc, "وصف الانجاز", info.description, pageW);
        writeField(doc, "تاريخ الانجاز", info.date, pageW);
        if (info.performer !== "-") writeField(doc, "القائم بالانجاز", info.performer, pageW);

        if (a.Attachments && a.Attachments.length > 0) {
          doc.moveDown(1);
          doc.fontSize(12).fillColor("#1a5fb4").text("المرفقات:", 70, doc.y, { features: ["rtla"], align: "right" });
          doc.moveDown(0.5);

          for (const link of a.Attachments) {
            const fullUrl = link.startsWith("http") ? link : `${req.protocol}://${req.get("host")}${link}`;
            const ext = path.extname(fullUrl).toLowerCase();
            let imageDisplayed = false;
            const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);

            if (isImage) {
              const imgBuffer = await getImageBuffer(fullUrl);
              if (imgBuffer) {
                try {
                  const imgWidth = 360, imgHeight = 150;
                  if (doc.y + imgHeight > pageH - 80) { doc.addPage(); drawBorder(); doc.moveDown(1); }
                  const xPos = (pageW - imgWidth) / 2, currentY = doc.y;
                  doc.image(imgBuffer, xPos, currentY, { fit: [imgWidth, imgHeight], align: "center", valign: "center" });
                  doc.y = currentY + imgHeight + 20; imageDisplayed = true;
                } catch (err) { console.error("خطأ في تحميل الصورة:", err.message); }
              }
            }

            if (!imageDisplayed) {
              const linkHeight = 15;
              if (doc.y + linkHeight > pageH - 60) doc.moveDown(0.2);
              doc.fillColor("#1a5fb4").fontSize(11).text(fullUrl, 70, doc.y, {
                width: pageW - 140, align: "right", link: fullUrl, underline: true, features: ["rtla"],
              });
              doc.moveDown(0.6);
            } else doc.moveDown(0.8);
          }
        }
      }
    }

    doc.end();
    await new Promise((resolve, reject) => {
      pdfStream.on("finish", resolve);
      pdfStream.on("error", reject);
    });

    const pdfUrl = `${req.protocol}://${req.get("host")}/generated-files/${path.basename(pdfPath)}`;
    res.status(201).json({ success: true, message: "تم إنشاء التقرير بنجاح", file: pdfUrl });
  } catch (error) {
    console.error("خطأ في إنشاء التقرير:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء إنشاء التقرير", error: error.message });
  }
};

const viewPDF = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../generated-files/", filename);
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: "خطأ في عرض الملف" });
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
        .json({ success: false, message: "الانجاز غير موجود" });
    }

    const io = getIo();
    io.emit("updateActivity", activity);

    const notification = new Notification({
      message: `تم تحديث الانجاز: ${activity.activityTitle}`,
      activity: activity._id,
    });
    await notification.save();

    return res.json({
      success: true,
      message: " تم  تحديث حالة الانجاز الجامعي بنجاح",
      activity,
    });
  } catch (error) {
    console.error(" خطأ في تحديث حالة الانجاز:", error.message);
    res.status(500).json({
      success: false,
      message: "خطأ أثناء تحديث حالة الانجاز",
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
  viewPDF,
};

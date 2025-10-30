const activitymodel = require("../model/activity");
const { getIo } = require("../socket");
const Notification = require("../model/notifications");
const fs = require("fs");
const path = require("path");
const {formatEgyptTime} = require("../utils/getEgyptTime")
const PDFDocument = require("pdfkit");
const axios = require("axios");
const { JSDOM } = require("jsdom");
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
    const { activityTitle, activityDescription, MainCriteria, SubCriteria, name,SaveStatus } = req.body;

    const attachments = req.files.map(file => `/uploads/${file.filename}`);

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
    const activities = await activitymodel
      .find()
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("خطأ في جلب النشاطات:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي" });
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
      return res.status(404).json({ success: false, message: "النشاط غير موجود" });
    }

    // نبدأ بكائن تحديث فارغ
    const updates = {};

    // تحديث البيانات النصية لو موجودة
    const fields = ["activityTitle", "activityDescription", "MainCriteria", "SubCriteria", "name", "SaveStatus", "status"];
    fields.forEach(field => {
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
      finalAttachments = finalAttachments.filter(attachment => 
        !deletedAttachments.includes(attachment)
      );

      // ✅ حذف الملفات فعلياً من السيرفر
      for (const deletedAttachment of deletedAttachments) {
        try {
          const filePath = path.join(__dirname, '..', deletedAttachment);
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
      const newAttachments = req.files.map(file => `/uploads/${file.filename}`);
      finalAttachments = [...finalAttachments, ...newAttachments];
    }

    // ✅ التحقق من عدم تجاوز الحد الأقصى للملفات
    const maxFiles = 2;
    if (finalAttachments.length > maxFiles) {
      // حذف الملفات الجديدة التي تم رفعها
      req.files.forEach(file => {
        try {
          const filePath = path.join(__dirname, '../uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(`❌ خطأ في حذف الملف الزائد: ${file.filename}`, fileError);
        }
      });

      return res.status(400).json({
        success: false,
        message: `لا يمكن رفع أكثر من ${maxFiles} ملفات`
      });
    }

    // ✅ تحديث المرفقات النهائية
    updates.Attachments = finalAttachments;

    // ✅ تحديث النشاط
    const activity = await activitymodel.findByIdAndUpdate(
      activityId, 
      updates, 
      { new: true }
    ).populate("user", "fullname username role")
     .populate("MainCriteria", "name")
     .populate("SubCriteria", "name");

    console.log('📎 المرفقات النهائية:', finalAttachments);
    console.log('🔄 النشاط المحدث:', activity);

    res.status(200).json({
      success: true,
      message: "تم تحديث النشاط بنجاح",
      activity,
    });
  } catch (error) {
    console.error("❌ خطأ في تحديث النشاط:", error);
    
    // ✅ حذف الملفات الجديدة في حالة الخطأ
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          const filePath = path.join(__dirname, '../uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(`❌ خطأ في حذف الملف بعد الخطأ: ${file.filename}`, fileError);
        }
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "حدث خطأ أثناء التحديث",
      error: error.message 
    });
  }
};
function fixArabic(text) {
  if (!text) return "";
  return text.split(" ").reverse().join(" ");
}

async function getImageBuffer(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const contentType = response.headers["content-type"];
    if (contentType && contentType.startsWith("image/")) {
      return Buffer.from(response.data, "binary");
    }
    console.warn(" الرابط ليس صورة:", url);
    return null;
  } catch (error) {
    console.error(" فشل تحميل الصورة:", url);
    return null;
  }
}
// file system
function getUniqueFilePath(dir, baseName, ext) {
  let counter = 1;
  let filePath = path.join(dir, `${baseName}${ext}`);
  while (fs.existsSync(filePath)) {
    filePath = path.join(dir, `${baseName}_${counter++}${ext}`);
  }
  return filePath;
}
const updateActivityStatus = async (req, res) => {
  // removed browser variable since puppeteer not used
  try {
    const activityId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["مرفوض", "قيد المراجعة", "معتمد"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "حالة غير صالحة" });
    }

    const activity = await activitymodel
      .findByIdAndUpdate(activityId, { status }, { new: true })
      .populate("user", "fullname name role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");

    if (!activity) {
      return res.status(404).json({ success: false, message: "النشاط غير موجود" });
    }

    const io = getIo();
    io.emit("updateActivity", activity);

    const notification = new Notification({
      message: `تم تحديث النشاط: ${activity.activityTitle}`,
      activity: activity._id,
    });
    await notification.save();

    // ❌ لا تنشئ الملفات إلا إذا كانت الحالة "معتمد"
    if (status !== "معتمد") {
      return res.json({ success: true, activity });
    }

    // ------------------- إعداد البيانات -------------------
    const info = {
      title: activity.activityTitle,
      description: activity.activityDescription,
      mainCriteria: activity.MainCriteria?.name || "-",
      subCriteria: activity.SubCriteria?.name || "-",
      college: activity.user?.fullname || "-",
      performer: activity.name || "", // ← لو فاضي مش يظهر
      date: activity.date ? new Date(activity.date).toLocaleDateString("ar-EG") : "غير محدد",
    };

    // ------------------- تحميل الخط -------------------
    const fontPath = path.join(__dirname, "../fonts/Amiri-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      throw new Error("خط Amiri غير موجود! تأكد من وضعه في مجلد /fonts/.");
    }

    // ------------------- تحميل شعار الجامعة -------------------
    const logoPath = path.join(__dirname, "../assets/qena_university_logo.png");
    let logoBuffer = null;
    if (fs.existsSync(logoPath)) {
      logoBuffer = fs.readFileSync(logoPath);
    }

    // ------------------- تحميل الصور (مرفقات) -------------------
    const attachmentsHtmlBuffers = await Promise.all(
      (activity.Attachments || []).map(async (link) => {
        const fullUrl = link.startsWith("http")
          ? link
          : `${req.protocol}://${req.get("host")}${link}`;
        const ext = path.extname(fullUrl).toLowerCase();

        if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
          // حاول نجلب الصورة كـ buffer
          const imgBuffer = await getImageBuffer(fullUrl);
          if (imgBuffer) {
            return { type: "image", buffer: imgBuffer, url: fullUrl };
          }
        }
        return { type: "link", url: fullUrl };
      })
    );

    // ------------------- إعداد مجلد الإخراج -------------------
    const outputDir = path.join(__dirname, "../generated-files");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const cleanName = (text) =>
      text.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_");
    const baseName = `تقرير_${cleanName(info.title)}_${cleanName(info.college)}`;

    const pdfPath = getUniqueFilePath(outputDir, baseName, ".pdf");
    const docxPath = getUniqueFilePath(outputDir, baseName, ".docx");

    // ------------------- إنشاء PDF باستخدام PDFKit -------------------
    // إعداد المستند
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 70, right: 70 }
    });

    // سجل الخط
    doc.registerFont("Amiri", fontPath);

    // تيار الكتابة إلى ملف
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);

    // ترويسة (شعار + عنوان)
    if (logoBuffer) {
      // نحاول رسم الشعار في المنتصف
      try {
        // نرسم الصورة بعرض أقصى 100 مع الحفاظ على النسبة
        doc.image(logoBuffer, (doc.page.width - 100) / 2, doc.y, { width: 100 });
      } catch (e) {
        console.warn("تعذر تضمين الشعار في الـ PDF:", e.message);
      }
      doc.moveDown(0.6);
    }

    // عناوين مركزية
    doc
      .font("Amiri")
      .fontSize(20)
      .fillColor("#222222")
      .text(fixArabic("جامعة جنوب الوادي"), { align: "center" });

    doc.moveDown(0.2);

    doc
      .font("Amiri")
      .fontSize(16)
      .fillColor("#222222")
      .text(fixArabic("تقرير نشاط جامعي"), { align: "center" });

    doc.moveDown(0.6);

    // خط فاصل
    const leftX = doc.page.margins.left;
    const rightX = doc.page.width - doc.page.margins.right;
    const yLine = doc.y;
    doc.moveTo(leftX, yLine).lineTo(rightX, yLine).lineWidth(1.5).strokeColor("#222222").stroke();
    doc.moveDown(1);

    // معلومات (يمين - RTL)
    const infoLines = [
      `الكلية: ${info.college}`,
      `عنوان النشاط: ${info.title}`,
      `الوصف: ${info.description}`,
      `المعيار الرئيسي: ${info.mainCriteria}`,
      `المعيار الفرعي: ${info.subCriteria}`,
      `تاريخ النشاط: ${info.date}`,
    ];
    if (info.performer) infoLines.push(`اسم القائم بالنشاط: ${info.performer}`);

    // نطبع كل سطر محاذياً لليمين
    doc.fontSize(12).fillColor("#222222");
    for (const line of infoLines) {
      doc.text(fixArabic(line), {
        align: "right",
        continued: false,
        paragraphGap: 6,
        indent: 0,
      });
      doc.moveDown(0.3);
    }

    // مساحة قبل المرفقات
    if (attachmentsHtmlBuffers.length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).fillColor("#1a5fb4").text(fixArabic("المرفقات:"), { align: "right" });
      doc.moveDown(0.4);

      for (const item of attachmentsHtmlBuffers) {
        if (item.type === "image") {
          try {
            // ندرج الصورة بالحجم المناسب (fit)
            doc.image(item.buffer, {
              fit: [450, 300],
              align: "center",
              valign: "center"
            });
            doc.moveDown(0.6);
          } catch (e) {
            console.warn("تعذر تضمين صورة في الـ PDF:", e.message);
            // لو فشل الإدراج كصورة نكتب الرابط بدلًا من ذلك
            doc.fillColor("#1a5fb4").fontSize(11).text(fixArabic(item.url), { align: "right", link: item.url, underline: true });
            doc.moveDown(0.4);
          }
        } else {
          doc.fillColor("#1a5fb4").fontSize(11).text(fixArabic(item.url), {
            align: "right",
            link: item.url,
            underline: true
          });
          doc.moveDown(0.4);
        }
      }
    }
    // أنهِ المستند وانتظر كتابة الملف
    doc.end();
    await new Promise((resolve, reject) => {
      pdfStream.on("finish", resolve);
      pdfStream.on("error", reject);
    });

    // ------------------- إنشاء DOCX (كما في الكود الأصلي) -------------------
    const paragraphs = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: "جامعة جنوب الوادي",
            bold: true,
            size: 36,
            color: "1a5fb4",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [
          new TextRun({
            text: "تقرير نشاط جامعي",
            bold: true,
            size: 30,
            color: "1a5fb4",
          }),
        ],
      }),
    ];

    const lines = [
      `الكلية: ${info.college}`,
      `عنوان النشاط: ${info.title}`,
      `الوصف: ${info.description}`,
      `المعيار الرئيسي: ${info.mainCriteria}`,
      `المعيار الفرعي: ${info.subCriteria}`,
      `تاريخ النشاط: ${info.date}`,
    ];

    if (info.performer) lines.push(`اسم القائم بالنشاط: ${info.performer}`);

    lines.forEach((line) => {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 400, line: 300 },
          children: [
            new TextRun({
              text: line,
              size: 28,
              color: "222222",
            }),
          ],
        })
      );
    });

    if (activity.Attachments?.length) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 600, after: 400 },
          children: [
            new TextRun({
              text: "المرفقات:",
              bold: true,
              size: 30,
              color: "1a5fb4",
            }),
          ],
        })
      );

      for (const [i, link] of activity.Attachments.entries()) {
        const fullUrl = link.startsWith("http")
          ? link
          : `${req.protocol}://${req.get("host")}${link}`;
        const ext = path.extname(fullUrl).toLowerCase();

        if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
          const imgBuffer = await getImageBuffer(fullUrl);
          if (imgBuffer) {
            paragraphs.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
                children: [
                  new ImageRun({
                    data: imgBuffer,
                    transformation: { width: 420, height: 260 }
                  }),
                ],
              })
            );
            continue;
          }
        }

        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `${i + 1}- ${fullUrl}`,
                color: "1a5fb4",
                underline: { type: "single" },
                size: 26,
              }),
            ],
          })
        );
      }
    }

    const docxDoc = new Document({
      sections: [
        {
          properties: { rtl: true },
          children: paragraphs,
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(docxDoc);
    fs.writeFileSync(docxPath, docxBuffer);


    const pdfUrl = `${req.protocol}://${req.get("host")}/generated-files/${path.basename(pdfPath)}`;
    const docxUrl = `${req.protocol}://${req.get("host")}/generated-files/${path.basename(docxPath)}`;

    return res.json({
      success: true,
      message: " تم إنشاء ملفات التقرير الجامعي بنجاح",
      activity,
      files: { pdf: pdfUrl, docx: docxUrl },
    });
  } catch (error) {
    console.error(" خطأ في إنشاء التقرير:", error.message);
    // لا يوجد متصفح لإغلاقه الآن
    res.status(500).json({ success: false, message: "خطأ أثناء إنشاء التقرير", error: error.message });
  }
};

const viewPDF = async (req, res) => {
  try {
    const { filename } = req.params;

    // المسار الكامل للملف
    const filePath = path.join(__dirname, "../uploads/pdfs", filename);

    // تحديد نوع المحتوى PDF
    res.setHeader("Content-Type", "application/pdf");

    // فتح الملف مباشرة في المتصفح
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: "خطأ في عرض الملف" });
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
  try {
    const draftActivities = await activitymodel
      .find({ SaveStatus: "مسودة" })
      .populate("user", "fullname username role")
      .populate("MainCriteria", "name")
      .populate("SubCriteria", "name");
    if (!draftActivities) {
      return res
        .status(404)
        .json({ success: false, message: "النشاط غير موجود" });
    }
    if(draftActivities.length === 0){
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
    const achievements = await activitymodel
      .find()
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
      const timeText = formatEgyptTime(a.createdAt); //  هنا الاستدعاء الصحيح

      let criteriaText = "";
      if (mainCriteria && subCriteria)
        criteriaText = `ضمن المعيار "${mainCriteria}" - "${subCriteria}"`;
      else if (mainCriteria)
        criteriaText = `ضمن المعيار "${mainCriteria}"`;
      else if (subCriteria)
        criteriaText = `ضمن المعيار الفرعي "${subCriteria}"`;
      else
        criteriaText = "ضمن معيار لم يتم تحديده بعد";

      return {
        message: ` تمت إضافة إنجاز جديد بواسطة: ${userName}\n العنوان: "${title}"\n ${criteriaText}\n ${timeText}`,
        time: timeText,
        id: a._id,
      };
    });

    res.json(activities);
  } catch (err) {
    console.error("Error fetching recent achievements:", err);
    res.status(500).json({
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
  viewPDF
};

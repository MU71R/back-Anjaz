// function fixArabic(text) {
//   if (!text) return "";
//   return text.split(" ").reverse().join(" ");
// }

// async function getImageBuffer(url) {
//   try {
//     const response = await axios.get(url, { responseType: "arraybuffer" });
//     const contentType = response.headers["content-type"];
//     if (contentType && contentType.startsWith("image/")) {
//       return Buffer.from(response.data, "binary");
//     }
//     console.warn(" الرابط ليس صورة:", url);
//     return null;
//   } catch (error) {
//     console.error(" فشل تحميل الصورة:", url);
//     return null;
//   }
// }
// // file system
// function getUniqueFilePath(dir, baseName, ext) {
//   let counter = 1;
//   let filePath = path.join(dir, `${baseName}${ext}`);
//   while (fs.existsSync(filePath)) {
//     filePath = path.join(dir, `${baseName}_${counter++}${ext}`);
//   }
//   return filePath;
// }
// const updateActivityStatus = async (req, res) => {
//   // removed browser variable since puppeteer not used
//   try {
//     const activityId = req.params.id;
//     const { status } = req.body;

//     const validStatuses = ["مرفوض", "قيد المراجعة", "معتمد"];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ success: false, message: "حالة غير صالحة" });
//     }

//     const activity = await activitymodel
//       .findByIdAndUpdate(activityId, { status }, { new: true })
//       .populate("user", "fullname name role")
//       .populate("MainCriteria", "name")
//       .populate("SubCriteria", "name");

//     if (!activity) {
//       return res.status(404).json({ success: false, message: "النشاط غير موجود" });
//     }

//     const io = getIo();
//     io.emit("updateActivity", activity);

//     const notification = new Notification({
//       message: `تم تحديث النشاط: ${activity.activityTitle}`,
//       activity: activity._id,
//     });
//     await notification.save();

//     // ❌ لا تنشئ الملفات إلا إذا كانت الحالة "معتمد"
//     if (status !== "معتمد") {
//       return res.json({ success: true, activity });
//     }

//     // ------------------- إعداد البيانات -------------------
//     const info = {
//       title: activity.activityTitle,
//       description: activity.activityDescription,
//       mainCriteria: activity.MainCriteria?.name || "-",
//       subCriteria: activity.SubCriteria?.name || "-",
//       college: activity.user?.fullname || "-",
//       performer: activity.name || "", // ← لو فاضي مش يظهر
//       date: activity.date ? new Date(activity.date).toLocaleDateString("ar-EG") : "غير محدد",
//     };

//     // ------------------- تحميل الخط -------------------
//     const fontPath = path.join(__dirname, "../fonts/Amiri-Regular.ttf");
//     if (!fs.existsSync(fontPath)) {
//       throw new Error("خط Amiri غير موجود! تأكد من وضعه في مجلد /fonts/.");
//     }

//     // ------------------- تحميل شعار الجامعة -------------------
//     const logoPath = path.join(__dirname, "../assets/qena_university_logo.png");
//     let logoBuffer = null;
//     if (fs.existsSync(logoPath)) {
//       logoBuffer = fs.readFileSync(logoPath);
//     }

//     // ------------------- تحميل الصور (مرفقات) -------------------
//     const attachmentsHtmlBuffers = await Promise.all(
//       (activity.Attachments || []).map(async (link) => {
//         const fullUrl = link.startsWith("http")
//           ? link
//           : `${req.protocol}://${req.get("host")}${link}`;
//         const ext = path.extname(fullUrl).toLowerCase();

//         if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
//           // حاول نجلب الصورة كـ buffer
//           const imgBuffer = await getImageBuffer(fullUrl);
//           if (imgBuffer) {
//             return { type: "image", buffer: imgBuffer, url: fullUrl };
//           }
//         }
//         return { type: "link", url: fullUrl };
//       })
//     );

//     // ------------------- إعداد مجلد الإخراج -------------------
//     const outputDir = path.join(__dirname, "../generated-files");
//     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//     const cleanName = (text) =>
//       text.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_");
//     const baseName = `تقرير_${cleanName(info.title)}_${cleanName(info.college)}`;

//     const pdfPath = getUniqueFilePath(outputDir, baseName, ".pdf");
//     const docxPath = getUniqueFilePath(outputDir, baseName, ".docx");

//     // ------------------- إنشاء PDF باستخدام PDFKit -------------------
//     // إعداد المستند
//     const doc = new PDFDocument({
//       size: "A4",
//       margins: { top: 50, bottom: 50, left: 70, right: 70 }
//     });

//     // سجل الخط
//     doc.registerFont("Amiri", fontPath);

//     // تيار الكتابة إلى ملف
//     const pdfStream = fs.createWriteStream(pdfPath);
//     doc.pipe(pdfStream);

//     // ترويسة (شعار + عنوان)
//     if (logoBuffer) {
//       // نحاول رسم الشعار في المنتصف
//       try {
//         // نرسم الصورة بعرض أقصى 100 مع الحفاظ على النسبة
//         doc.image(logoBuffer, (doc.page.width - 100) / 2, doc.y, { width: 100 });
//       } catch (e) {
//         console.warn("تعذر تضمين الشعار في الـ PDF:", e.message);
//       }
//       doc.moveDown(0.6);
//     }

//     // عناوين مركزية
//     doc
//       .font("Amiri")
//       .fontSize(20)
//       .fillColor("#222222")
//       .text(fixArabic("جامعة جنوب الوادي"), { align: "center" });

//     doc.moveDown(0.2);

//     doc
//       .font("Amiri")
//       .fontSize(16)
//       .fillColor("#222222")
//       .text(fixArabic("تقرير نشاط جامعي"), { align: "center" });

//     doc.moveDown(0.6);

//     // خط فاصل
//     const leftX = doc.page.margins.left;
//     const rightX = doc.page.width - doc.page.margins.right;
//     const yLine = doc.y;
//     doc.moveTo(leftX, yLine).lineTo(rightX, yLine).lineWidth(1.5).strokeColor("#222222").stroke();
//     doc.moveDown(1);

//     // معلومات (يمين - RTL)
//     const infoLines = [
//       `الكلية: ${info.college}`,
//       `عنوان النشاط: ${info.title}`,
//       `الوصف: ${info.description}`,
//       `المعيار الرئيسي: ${info.mainCriteria}`,
//       `المعيار الفرعي: ${info.subCriteria}`,
//       `تاريخ النشاط: ${info.date}`,
//     ];
//     if (info.performer) infoLines.push(`اسم القائم بالنشاط: ${info.performer}`);

//     // نطبع كل سطر محاذياً لليمين
//     doc.fontSize(12).fillColor("#222222");
//     for (const line of infoLines) {
//       doc.text(fixArabic(line), {
//         align: "right",
//         continued: false,
//         paragraphGap: 6,
//         indent: 0,
//       });
//       doc.moveDown(0.3);
//     }

//     // مساحة قبل المرفقات
//     if (attachmentsHtmlBuffers.length > 0) {
//       doc.moveDown(1);
//       doc.fontSize(14).fillColor("#1a5fb4").text(fixArabic("المرفقات:"), { align: "right" });
//       doc.moveDown(0.4);

//       for (const item of attachmentsHtmlBuffers) {
//         if (item.type === "image") {
//           try {
//             // ندرج الصورة بالحجم المناسب (fit)
//             doc.image(item.buffer, {
//               fit: [450, 300],
//               align: "center",
//               valign: "center"
//             });
//             doc.moveDown(0.6);
//           } catch (e) {
//             console.warn("تعذر تضمين صورة في الـ PDF:", e.message);
//             // لو فشل الإدراج كصورة نكتب الرابط بدلًا من ذلك
//             doc.fillColor("#1a5fb4").fontSize(11).text(fixArabic(item.url), { align: "right", link: item.url, underline: true });
//             doc.moveDown(0.4);
//           }
//         } else {
//           doc.fillColor("#1a5fb4").fontSize(11).text(fixArabic(item.url), {
//             align: "right",
//             link: item.url,
//             underline: true
//           });
//           doc.moveDown(0.4);
//         }
//       }
//     }
//     // أنهِ المستند وانتظر كتابة الملف
//     doc.end();
//     await new Promise((resolve, reject) => {
//       pdfStream.on("finish", resolve);
//       pdfStream.on("error", reject);
//     });

//     // ------------------- إنشاء DOCX (كما في الكود الأصلي) -------------------
//     const paragraphs = [
//       new Paragraph({
//         alignment: AlignmentType.CENTER,
//         spacing: { after: 600 },
//         children: [
//           new TextRun({
//             text: "جامعة جنوب الوادي",
//             bold: true,
//             size: 36,
//             color: "1a5fb4",
//           }),
//         ],
//       }),
//       new Paragraph({
//         alignment: AlignmentType.CENTER,
//         spacing: { after: 600 },
//         children: [
//           new TextRun({
//             text: "تقرير نشاط جامعي",
//             bold: true,
//             size: 30,
//             color: "1a5fb4",
//           }),
//         ],
//       }),
//     ];

//     const lines = [
//       `الكلية: ${info.college}`,
//       `عنوان النشاط: ${info.title}`,
//       `الوصف: ${info.description}`,
//       `المعيار الرئيسي: ${info.mainCriteria}`,
//       `المعيار الفرعي: ${info.subCriteria}`,
//       `تاريخ النشاط: ${info.date}`,
//     ];

//     if (info.performer) lines.push(`اسم القائم بالنشاط: ${info.performer}`);

//     lines.forEach((line) => {
//       paragraphs.push(
//         new Paragraph({
//           alignment: AlignmentType.RIGHT,
//           spacing: { before: 200, after: 400, line: 300 },
//           children: [
//             new TextRun({
//               text: line,
//               size: 28,
//               color: "222222",
//             }),
//           ],
//         })
//       );
//     });

//     if (activity.Attachments?.length) {
//       paragraphs.push(
//         new Paragraph({
//           alignment: AlignmentType.RIGHT,
//           spacing: { before: 600, after: 400 },
//           children: [
//             new TextRun({
//               text: "المرفقات:",
//               bold: true,
//               size: 30,
//               color: "1a5fb4",
//             }),
//           ],
//         })
//       );

//       for (const [i, link] of activity.Attachments.entries()) {
//         const fullUrl = link.startsWith("http")
//           ? link
//           : `${req.protocol}://${req.get("host")}${link}`;
//         const ext = path.extname(fullUrl).toLowerCase();

//         if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
//           const imgBuffer = await getImageBuffer(fullUrl);
//           if (imgBuffer) {
//             paragraphs.push(
//               new Paragraph({
//                 alignment: AlignmentType.CENTER,
//                 spacing: { after: 600 },
//                 children: [
//                   new ImageRun({
//                     data: imgBuffer,
//                     transformation: { width: 420, height: 260 }
//                   }),
//                 ],
//               })
//             );
//             continue;
//           }
//         }

//         paragraphs.push(
//           new Paragraph({
//             alignment: AlignmentType.RIGHT,
//             spacing: { after: 300 },
//             children: [
//               new TextRun({
//                 text: `${i + 1}- ${fullUrl}`,
//                 color: "1a5fb4",
//                 underline: { type: "single" },
//                 size: 26,
//               }),
//             ],
//           })
//         );
//       }
//     }

//     const docxDoc = new Document({
//       sections: [
//         {
//           properties: { rtl: true },
//           children: paragraphs,
//         },
//       ],
//     });

//     const docxBuffer = await Packer.toBuffer(docxDoc);
//     fs.writeFileSync(docxPath, docxBuffer);


//     const pdfUrl = `${req.protocol}://${req.get("host")}/generated-files/${path.basename(pdfPath)}`;
//     const docxUrl = `${req.protocol}://${req.get("host")}/generated-files/${path.basename(docxPath)}`;

//     return res.json({
//       success: true,
//       message: " تم إنشاء ملفات التقرير الجامعي بنجاح",
//       activity,
//       files: { pdf: pdfUrl, docx: docxUrl },
//     });
//   } catch (error) {
//     console.error(" خطأ في إنشاء التقرير:", error.message);
//     // لا يوجد متصفح لإغلاقه الآن
//     res.status(500).json({ success: false, message: "خطأ أثناء إنشاء التقرير", error: error.message });
//   }
// };

// const viewPDF = async (req, res) => {
//   try {
//     const { filename } = req.params;
//     const filePath = path.join(__dirname, "../generated-files/", filename);
//     res.setHeader("Content-Type", "application/pdf");
//     res.sendFile(filePath);
//   } catch (error) {
//     res.status(500).json({ success: false, message: "خطأ في عرض الملف" });
//   }
// };
// const viewDOCX = async (req, res) => {
//   try {
//     const { filename } = req.params;
//     const filePath = path.join(__dirname, "../generated-files/", filename);

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//     );

//     // هنا بنخلي الملف يتحمل أو يفتح في Microsoft Word
//  const safeFilename = encodeURIComponent(filename);

// res.setHeader(
//   "Content-Disposition",
//   `inline; filename="${safeFilename}"`
// );

//     res.sendFile(filePath);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "خطاء في عرض الملف" });
//   }
// };
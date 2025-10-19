const usermodel = require("../model/users");
const adddepartment = async (req, res) => {
  try {
    const { username, fullname, password, role, sector, phone, } = req.body;
    if (!fullname) {
      return res.status(400).json({ message: "اسم القسم مطلوب." });
    }
    if (!password) {
      return res.status(400).json({ message: "كلمة المرور مطلوبة." });
    }
    if (!role) {
      return res.status(400).json({ message: "الدور مطلوب." });
    }
    if (!sector) {
      return res.status(400).json({ message: "القطاع مطلوب." });
    }
    if (!username) {
      return res.status(400).json({ message: "اسم المستخدم مطلوب." });
    }

    const newDepartment = await usermodel.create({
      username,
      fullname,
      password,
      role,
      sector,
      phone,
      status:"active"
    });
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error("خطأ في انشاء قسم", error);
    res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
  }
};
const addsector = async (req, res) => {
  try {
    const { sector } = req.body;
    if (!sector) {
      return res.status(400).json({ message: "اسم القطاع مطلوب." });
    }
    const newSector = await usermodel.create({
      sector,
    });
    res.status(201).json(newSector);
  } catch (error) {
    console.error("خطأ في انشاء قطاع", error);
    res.status(500).json({ message: "خطأ في الخادم الداخلي" });
  }
};
const getallusers = async (req, res) => {
    try {
        const users = await usermodel.find().select("-password");
        res.status(200).json(users);
      } catch (error) {
        console.error("خطأ في جلب المستخدمين", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};
const getuserbyid = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await usermodel.findOne({ _id: id }).select("-password");
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        res.status(200).json(user);
      } catch (error) {
        console.error("خطأ في جلب المستخدم", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};
const updatestatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = await usermodel.findByIdAndUpdate(
          id,
          { status },   
          { new: true }
        );
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        res.status(200).json(user);
      } catch (error) {
        console.error("خطأ في تحديث حالة المستخدم", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};
const stats = async (req, res) => {
    try {
        const totalUsers = await usermodel.countDocuments();
        const activeUsers = await usermodel.countDocuments({ status: "active" });
        const inactiveUsers = await usermodel.countDocuments({ status: "inactive" });
        res.status(200).json({ totalUsers, activeUsers, inactiveUsers });
      } catch (error) {
        console.error("خطأ في جلب الاحصائيات", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }

};
module.exports = { adddepartment, addsector, getallusers,getuserbyid,stats,updatestatus };

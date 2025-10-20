const usermodel = require("../model/users");
const adddepartment = async (req, res) => {
  try {
    const { username, fullname, password, role, sector, } = req.body;
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

// get all sectors
const getallsectors = async (req, res) => {
    try {
        const sectors = await usermodel.find( {sector: { $exists: true } }).select("-password");
        res.status(200).json(sectors);
      } catch (error) {
        console.error("خطأ في جلب القطاعات", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};

// delete user
const deleteuser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await usermodel.findByIdAndDelete(id);
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        res.status(200).json(user);
      } catch (error) {
        console.error("خطأ في حذف المستخدم", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};

// update user
const updateuser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateuser = req.body;
        const user = await usermodel.findByIdAndUpdate(id, updateuser, { new: true });
        if (!user) {
          return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        res.status(200).json(user);
      } catch (error) {
        console.error("خطأ في تحديث المستخدم", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }

};

// delete sector
const deletesector = async (req, res) => {
    try {
        const { id } = req.params;
        const sector = await usermodel.findByIdAndDelete(id);
        if (!sector) {
          return res.status(404).json({ message: "القطاع غير موجود" });
        }
        res.status(200).json(sector);
      } catch (error) {
        console.error("خطأ في حذف القطاع", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};

// update sector
const updatesector = async (req, res) => {
    try {
        const { id } = req.params;
        const updatesector = req.body;
        const sector = await usermodel.findByIdAndUpdate(id, updatesector, { new: true });
        if (!sector) {
          return res.status(404).json({ message: "القطاع غير موجود" });
        }
        res.status(200).json(sector);
      } catch (error) {
        console.error("خطأ في تحديث القطاع", error);
        res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
      }
};


module.exports = { adddepartment, addsector, getallusers,getuserbyid,stats,updatestatus ,getallsectors,deleteuser,updateuser,deletesector,updatesector};

const MainCriteria = require("../model/maincriteria");
const SubCriteria = require("../model/subcriteria");

// add main criteria
const addMainCriteria = async (req, res) => {
  try {
    const { name, level, sector, departmentUser } = req.body;

    if (!name || !level) {
      return res.status(400).json({ error: "الاسم والمستوى مطلوبان" });
    }

    let query = { name, level };

    if (level === "SECTOR") {
      query.sector = sector;
    } else if (level === "DEPARTMENT") {
      query.departmentUser = departmentUser;
    }

    const existing = await MainCriteria.findOne(query);
    if (existing) {
      return res.status(400).json({ error: "المعيار موجود بالفعل" });
    }

    const newCriteria = new MainCriteria({
      name,
      level,
      sector: level === "SECTOR" ? sector : null,
      departmentUser: level === "DEPARTMENT" ? departmentUser : null,
    });

    await newCriteria.save();
    res.status(201).json(newCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// add sub criteria
const addSubCriteria = async (req, res) => {
  try {
    const { name, mainCriteria } = req.body;
    if (!name || !mainCriteria) {
      return res
        .status(400)
        .json({ error: "الاسم والمعيار الرئيسي مطلوبان", error });
    }
    const existingSubCriteria = await SubCriteria.findOne({ name });
    if (existingSubCriteria) {
      return res.status(400).json({ error: " المعايير الفرعية موجودة بالفعل" });
    }
    const subCriteria = new SubCriteria({
      name,
      mainCriteria,
      userId: req.user._id,
    });
    await subCriteria.save();
    res.status(201).json(subCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get all main criteria
const getAllMainCriteria = async (req, res) => {
  try {
    const user = req.user; // المستخدم الحالي

    const allCriteria = await MainCriteria.find()
      .populate("sector", "name")
      .populate("departmentUser", "fullname username")
      .populate({
        path: "subCriteria",
        select: "name userId",
        populate: { path: "userId", select: "fullname username" }
      });

    const filtered = allCriteria.filter(criteria => {
      if (criteria.level === "ALL") return true;
      if (criteria.level === "SECTOR" && criteria.sector?.toString() === user.sector?.toString()) return true;
      if (criteria.level === "DEPARTMENT" && criteria.departmentUser?.toString() === user._id.toString()) return true;
      return false;
    });

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// get all sub criteria
const getAllSubCriteria = async (req, res) => {
  try {
    const subCriteria = await SubCriteria.find().populate("mainCriteria", "name").populate("userId","fullname username role");
    res.status(200).json(subCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update main criteria
const updateMainCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "الاسم مطلوب" });
    }
    const mainCriteria = await MainCriteria.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    res.status(200).json(mainCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update sub criteria
const updateSubCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "الاسم مطلوب" });
    }
    const subCriteria = await SubCriteria.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    res.status(200).json(subCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// delete main criteria
const deleteMainCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const mainCriteria = await MainCriteria.findByIdAndDelete(id);
    res.status(200).json(mainCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// delete sub criteria
const deleteSubCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const subCriteria = await SubCriteria.findByIdAndDelete(id);
    res.status(200).json(subCriteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addMainCriteria,
  addSubCriteria,
  getAllMainCriteria,
  getAllSubCriteria,
  updateMainCriteria,
  updateSubCriteria,
  deleteMainCriteria,
  deleteSubCriteria,
};

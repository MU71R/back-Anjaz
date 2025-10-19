const  User  = require("../model/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ userId: user._id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, user });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// register controller
const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ التحقق من الحقول
    if (!name || !email || !password) {
      return res.status(400).json({ message: "الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة." });
    }

    // ✅ التأكد من عدم وجود المستخدم مسبقًا
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "هذا البريد مستخدم مسبقًا." });
    }

    const newUser = await User.create({
      name,
      email,
      password
    });

    // ✅ إنشاء توكن
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ إرجاع الرد
    res.status(201).json({
      message: "تم إنشاء الحساب بنجاح ✅",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      token
    });

  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "حدث خطأ داخلي في الخادم" });
  }
};

module.exports = {loginController, registerController};

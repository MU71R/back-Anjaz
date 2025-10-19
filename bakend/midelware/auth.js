const jwt = require("jsonwebtoken");
const { promisify } = require("util");

// check token function
async function verifyTokenMiddleware(req, res, next) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "You must be logged in" });
  }

  try {
    const decoded = await promisify(jwt.verify)(
      authorization,
      process.env.JWT_SECRET
    );

    req.user = {
      _id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    }
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
function isAdmin(req, res, next) {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
}

module.exports = { verifyTokenMiddleware, isAdmin };
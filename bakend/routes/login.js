const express = require("express");
const router = express.Router();
const {loginController} = require("../controller/login");
router.post("/login", loginController);
<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> main

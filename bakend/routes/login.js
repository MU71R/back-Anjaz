const express = require("express");
const router = express.Router();
const {verifyTokenMiddleware,isAdmin} = require("../midelware/auth");
const {loginController, registerController} = require("../controller/login");
router.post("/login", loginController);
router.post("/register",  registerController);
module.exports = router;

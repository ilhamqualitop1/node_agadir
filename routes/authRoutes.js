const express = require("express");
const router = express.Router();
const { 
   register, 
    login, 
    verifyOTP,
    forgotPassword, 
    resetPassword, 
    changePassword 
} = require("../controllers/authController"); 

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);



module.exports = router;


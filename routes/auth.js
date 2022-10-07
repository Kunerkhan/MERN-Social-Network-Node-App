const express = require("express");

const { signUp, signIn, signOut, forgotPassword, resetPassword, socialLogin } = require("../controllers/auth");
const { userSignUpValidator, passwordResetValidator } = require("../validators");
const { getUserById } = require("../controllers/user");

const router = express.Router();

router.post("/social-login", socialLogin);

router.post("/signUp", userSignUpValidator, signUp);

router.post("/signIn", signIn);

router.get("/signOut", signOut);

router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

// any route with userId param, will execute getUserById method
router.param("userId", getUserById);


module.exports = router;
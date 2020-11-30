const express = require("express");
// const router = express.Router()
const router = require("express-promise-router")();

const UserController = require("../controllers/user");

const {
  validateBody,
  validateParam,
  schemas,
} = require("../helpers/routerHelpers");

const passport = require("passport");
const passportConfig = require("../middlewares/passport"); // chi la noi code, khong de ngoai app vi chi dung cho user

router
  .route("/")
  .get(UserController.index)
  .post(validateBody(schemas.userSchema), UserController.newUser);

router
  .route("/signup")
  .post(validateBody(schemas.authSignUpSchema), UserController.signUp);

router
  .route("/signin")
  .post(
    validateBody(schemas.authSignInSchema),
    passport.authenticate("local", { session: false }),
    UserController.signIn
  );

router
  .route("/secret")
  .get(passport.authenticate("body-jwt", { session: false }), UserController.secret);

router
  .route("/changePassword")
  .get(UserController.forgotPassword)
  .post(
    passport.authenticate("token_query-jwt", { session: false }),
    UserController.newPassword);
    
router.post('/resetPassword', validateBody(schemas.userResetPassword), UserController.resetPassword)

router
  .route("/:userID")
  .get(validateParam(schemas.idSchema, "userID"), UserController.getUser)
  .patch(
    validateParam(schemas.idSchema, "userID"),
    validateBody(schemas.userOptionalSchema),
    UserController.updateUser
  );

module.exports = router;

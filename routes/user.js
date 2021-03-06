const express = require("express");
// const router = express.Router()
const router = require("express-promise-router")();

const UserController = require("../controllers/user");

const {
  validateBody,
  validateParam,
  schemas,
  validateQuery,
} = require("../helpers/routerHelpers");
const { isSuperAdmin } = require("../helpers/shopValidate");
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
  .get(
    passport.authenticate("body-jwt", { session: false }),
    UserController.secret
  );

router
  .route("/changePassword")
  .get(UserController.forgotPassword)
  .post(
    passport.authenticate("token_query-jwt", { session: false }),
    UserController.newPassword
  );

router.post(
  "/resetPassword",
  validateBody(schemas.userResetPassword),
  UserController.resetPassword
);

router
  .route("/:userID")
  .get(validateParam(schemas.idSchema, "userID"), UserController.getUser)
  .patch(
    validateParam(schemas.idSchema, "userID"),
    validateBody(schemas.userOptionalSchema),
    UserController.updateUser
  );

router
  .route("/admin/changePassword")
  .patch(
    passport.authenticate("jwt", { session: false }),
    isSuperAdmin,
    validateBody(schemas.userChangePassSchema),
    UserController.changUserPass
  );

router
  .route("/admin/users")
  .get(
    passport.authenticate("jwt", { session: false }),
    isSuperAdmin,
    validateQuery(schemas.allUserPagination),
    UserController.getAllUser
  );

router
  .route("/admin/users/:userID")
  .delete(
    passport.authenticate("jwt", { session: false }),
    isSuperAdmin,
    validateParam(schemas.idSchema, "userID"),
    UserController.removeUser
);

module.exports = router;

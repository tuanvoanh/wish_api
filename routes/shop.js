const express = require("express");
// const router = express.Router()
const router = require("express-promise-router")();

const ShopController = require("../controllers/shop");

const {
  validateBody,
  validateParam,
  schemas,
} = require("../helpers/routerHelpers");

const passport = require("passport");
const passportConfig = require("../middlewares/passport"); // chi la noi code, khong de ngoai app vi chi dung cho user

router
  .route("/")
  .get(
    passport.authenticate("jwt", { session: false }),
    validateQuery(schemas.shopPagination),
    ShopController.listShopOfUser
  )
  .post(
    passport.authenticate("jwt", { session: false }),
    validateBody(schemas.shopSchema),
    ShopController.creatNewShop
  );

router
  .route("/:shop_id")
  .get(
    passport.authenticate("jwt", { session: false }),
    validateQuery(),
    //controller
  )
  .put(
    passport.authenticate("jwt", { session: false }),
    validateBody(schemas.shopSchema), 
    // 
  );

router
  .route("/:shop_id/code_url")
  .get(
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, 'shop_id'),
    ShopController.createCodeUrl
  )

router
  .route("/:shop_id/code/:code")
  .get(
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, 'shop_id'),
    ShopController.applyCode
  )


// router
//   .route(":shop_id/users")
//   .get( // get list user
//     passport.authenticate("jwt", { session: false }),
//     validateParam(schemas.idSchema, "shop_id"),
//     // controller
//   )
//   .post( // add new user
//     passport.authenticate("jwt", { session: false }), // ad new user
//     validateParam(schemas.idSchema, "shop_id"),
//     // isAdmin
//     validateBody(schemas.authSignUpSchema), 
//     // controller
//   );

// router
//   .route(":shop_id/users/:user_id")
//   .delete( // remove user
//     passport.authenticate("jwt", { session: false }), // ad new user
//     validateParam(schemas.idSchema, "shop_id"),
//     validateParam(schemas.idSchema, "user_id"),
//     // isAdmin
//     validateBody(schemas.authSignUpSchema), 
//     // controller
//   );


module.exports = router;

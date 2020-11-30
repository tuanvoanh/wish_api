const express = require("express");
// const router = express.Router()
const router = require("express-promise-router")();

const ShopController = require("../controllers/shop");

const {
  validateBody,
  validateParam,
  validateQuery,
  schemas,
} = require("../helpers/routerHelpers");
const { isAdmin, isMember } = require("../helpers/shopValidate");
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
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    ShopController.shopDetail
  )
  .put(
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    validateBody(schemas.shopSchema),
    ShopController.editShop
  )
  .delete(
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    ShopController.removeShop
  );

router
  .route("/:shop_id/code_url")
  .get(
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    ShopController.createCodeUrl
  );

router
  .route("/:shop_id/code/:code")
  .get(
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    validateParam(schemas.codeSchema, "code"),
    ShopController.applyCode
  );

router
  .route("/:shop_id/staffs")
  .get(
    // get list user
    passport.authenticate("jwt", { session: false }),
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    ShopController.listStaff
  )
  .post(
    // add new staff
    passport.authenticate("jwt", { session: false }), // ad new user
    validateParam(schemas.idSchema, "shop_id"),
    isAdmin,
    validateBody(schemas.addUserSchema),
    ShopController.addStaff
  );

router.route("/:shop_id/staffs/:staff_id").delete(
  // remove user
  passport.authenticate("jwt", { session: false }), // ad new user
  validateParam(schemas.idSchema, "shop_id"),
  validateParam(schemas.idSchema, "staff_id"),
  isAdmin,
  ShopController.removeStaff
);

router.route("/:shop_id/delivery_countries").get(
  passport.authenticate("jwt", { session: false }), // get delivery country
  validateParam(schemas.idSchema, "shop_id"),
  isMember,
  ShopController.getDeliveryCountry
);

router.route("/:shop_id/shipping_carriers").get(
  passport.authenticate("jwt", { session: false }), // get delivery country
  validateParam(schemas.idSchema, "shop_id"),
  validateQuery(schemas.localSchema),
  isMember,
  ShopController.getShippingCarrier
);

router.route("/:shop_id/orders").get(
  passport.authenticate("jwt", { session: false }), // get delivery country
  validateParam(schemas.idSchema, "shop_id"),
  validateQuery(schemas.orderQuerySchema),
  isMember,
  ShopController.getAllOrder
);

router
  .route("/:shop_id/fullfill_orders")
  .get(
    passport.authenticate("jwt", { session: false }), // get delivery country
    validateParam(schemas.idSchema, "shop_id"),
    validateQuery(schemas.orderQuerySchema),
    isMember,
    ShopController.getFullFillOrder
  )
  .post(
    passport.authenticate("jwt", { session: false }), // get delivery country
    validateParam(schemas.idSchema, "shop_id"),
    validateBody(schemas.fulfillOrderSchema),
    isMember,
    ShopController.fullFillOrder
  );

router.route("/:shop_id/refresh_token_url").get(
  passport.authenticate("jwt", { session: false }), // get delivery country
  validateParam(schemas.idSchema, "shop_id"),
  isAdmin,
  ShopController.getRefreshUrl
);

router.route("/:shop_id/access_token").put(
  passport.authenticate("jwt", { session: false }), // get delivery country
  validateParam(schemas.idSchema, "shop_id"),
  validateBody(schemas.updateAccessTokenSchema),
  isAdmin,
  ShopController.updateAccessToken
);
module.exports = router;

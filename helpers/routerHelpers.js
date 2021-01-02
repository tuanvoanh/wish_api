const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date")
const Joi = JoiBase.extend(JoiDate)
const Role = require('../enums').eROLE

const validateBody = (schema) => {
  return (req, res, next) => {
    const validatorResult = schema.validate(req.body);
    if (validatorResult.error) {
      return res.status(400).json(validatorResult.error);
    } else {
      if (!req.value) req.value = {};
      if (!req.value["params"]) req.value.params = {};

      req.value.body = validatorResult.value;
      next();
    }
  };
};

const validateParam = (schema, name) => {
  return (req, res, next) => {
    const validatorResult = schema.validate({ param: req.params[name] });

    if (validatorResult.error) {
      return res.status(400).json(validatorResult.error);
    } else {
      if (!req.value) req.value = {};
      if (!req.value["params"]) req.value.params = {};

      req.value.params[name] = req.params[name];
      next();
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const validatorResult = schema.validate(req.query);

    if (validatorResult.error) {
      return res.status(400).json(validatorResult.error);
    } else {
      if (!req.value) req.value = {};
      if (!req.value["params"]) req.value.params = {};

      req.value.query = validatorResult.value;
      next();
    }
  };
};

const schemas = {
  authSignInSchema: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  addUserSchema: Joi.object().keys({
    email: Joi.string().email().required(),
    role: Joi.string().valid(Role.staff)
  }),

  authSignUpSchema: Joi.object().keys({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  idSchema: Joi.object().keys({
    param: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),

  codeSchema: Joi.object().keys({
    param: Joi.string()
  }),

  localSchema: Joi.object().keys({
    locale: Joi.string().required().min(2)
  }),

  orderQuerySchema: Joi.object().keys({
    start: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(0).default(5),
    order: Joi.string().optional()
  }),

  orderShopQuerySchema: Joi.object().keys({
    start: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(0).default(5),
    order: Joi.string().optional(),
    sortCol: Joi.string().valid("last_updated", "order_time", "hours_to_fulfill", "isNoted", "state",null, "").optional(),
    sort: Joi.number().valid(1,-1),
    type: Joi.string().valid("action_required", "noted", null, "").optional()
  }),

  orderShopBodySchema: Joi.object().keys({
    listShop: Joi.array(),
    all: Joi.boolean().optional().default(false)
  }),

  intSchema: Joi.object().keys({
    param: Joi.number().integer().min(0).required(),
  }),

  userSchema: Joi.object().keys({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
  }),

  userOptionalSchema: Joi.object().keys({
    firstName: Joi.string().min(2),
    lastName: Joi.string().min(2),
    email: Joi.string().email(),
  }),

  userChangePassSchema: Joi.object().keys({
    password: Joi.string().min(6),
    email: Joi.string().email(),
  }),

  userResetPassword: Joi.object().keys({
    email: Joi.string().email(),
  }),

  shopSchema: Joi.object().keys({
    name: Joi.string().min(5).required(),
    clientId: Joi.string().min(10).required(),
    clientSecret: Joi.string().min(10).required(),
  }),

  shopPagination: Joi.object().keys({
    page: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().positive().default(10),
    name: Joi.string().optional()
  }),

  allUserPagination: Joi.object().keys({
    page: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().positive().default(10),
    s_email: Joi.string().optional()
  }),

  fulfillOrderSchema: Joi.object().keys({
    shippingCarrier: Joi.string().min(2).required(), 
    countryCode: Joi.string().min(2).required(), 
    orderId: Joi.string().min(8).required(),
    trackingNumber: Joi.string().optional()
  }),

  refundOrderSchema: Joi.object().keys({
    reasonCode: Joi.number().valid(1, 25, 32).required(), 
    orderId: Joi.string().min(8).required(), 
  }),

  updateAccessTokenSchema: Joi.object().keys({
    accessToken: Joi.string().min(2).required(), 
    expiredTime: Joi.date().required(), 
  }),

  syncDateSchema: Joi.object().keys({
    date: Joi.date().format('YYYY-MM-DD').required()
  }),

  noteOrderSchema: Joi.object().keys({
    isNoted: Joi.boolean().required()
  }),
};

module.exports = {
  validateBody,
  validateParam,
  validateQuery,
  schemas,
};

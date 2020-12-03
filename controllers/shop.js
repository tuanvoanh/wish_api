const ShopUser = require("../models/ShopUser");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Role = require("../enums").eROLE;
const config = require("../configs");
const axios = require("axios");
const axiosWishError = require("../helpers/errorInstance").axiosWishError;

const listShopOfUser = async (req, res, next) => {
  const limit = req.value.query.limit;
  const page = req.value.query.page;
  const skip = page * limit;
  const listShop = await ShopUser.find({
    user: req.user._id,
  })
    .populate({
      path: "shop",
      select: { name: 1, clientId: 1, clientSecret: 1, expiredTime: 1 },
    })
    .skip(skip)
    .limit(limit);
  const totalShop = await ShopUser.find({
    user: req.user._id,
  }).count();
  return res.status(200).json({
    total_item: totalShop,
    total_page: Math.ceil(totalShop / limit),
    per_page: limit,
    current_page: page,
    items: listShop,
  });
};

const shopDetail = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const myShop = await ShopUser.findOne({
    user: req.user._id,
    shop: shop_id,
  }).populate({
    path: "shop",
    select: { name: 1, clientId: 1, clientSecret: 1, expiredTime: 1 },
  });
  return res.status(200).json(myShop);
};

const listStaff = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const myShop = await ShopUser.find({
    shop: shop_id,
  }).populate({
    path: "user",
    select: { firstName: 1, lastName: 1, email: 1, isActive: 1 },
  });
  return res.status(200).json(myShop);
};

const addStaff = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { email, role } = req.value.body;
  const existedUser = await User.findOne({ email });
  if (!existedUser) {
    throw new Error("this email does not exist");
  }
  const existedStaff = await ShopUser.findOne({
    shop: shop_id,
    user: existedUser._id,
  });
  if (existedStaff) {
    throw new Error("this staff has been added");
  }
  await ShopUser.create({
    shop: shop_id,
    user: existedUser._id,
    role,
  });
  return res.status(200).json({ success: true });
};

const removeStaff = async (req, res, next) => {
  const { shop_id, staff_id } = req.value.params;
  const isAdmin = await ShopUser.findOne({
    shop: shop_id,
    _id: staff_id,
    role: Role.admin,
  });
  if (isAdmin) {
    throw new Error("cannot remove Admin");
  }
  await ShopUser.deleteOne({
    shop: shop_id,
    _id: staff_id,
  });
  return res.status(204).json({});
};

const creatNewShop = async (req, res, next) => {
  const clientIdExisted = await ShopUser.findOne({clientId: req.value.body.clientId})
  if (clientIdExisted) {
    throw new Error("this Client Id is existed")
  }
  const newShop = await Shop.create({
    name: req.value.body.name,
    created_by: req.user._id,
    clientSecret: req.value.body.clientSecret,
    clientId: req.value.body.clientId,
  });
  const newShopUser = await ShopUser.create({
    user: req.user._id,
    shop: newShop._id,
    role: Role.admin,
  });
  return res.status(201).json(newShopUser);
};

const editShop = async (req, res, next) => {
  const { shop_id } = req.value.params;

  const myShop = await Shop.updateOne(
    { _id: shop_id },
    {
      $set: {
        name: req.value.body.name,
        clientSecret: req.value.body.clientSecret,
        clientId: req.value.body.clientId,
      },
    }
  );
  return res.status(200).json({ success: true });
};

const removeShop = async (req, res, next) => {
  const { shop_id } = req.value.params;
  await ShopUser.deleteMany({ shop: shop_id });
  await ShopUser.deleteOne({ _id: shop_id });
  return res.status(204).json({});
};

const createCodeUrl = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const theShop = await Shop.findById(shop_id);
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const { clientId, clientSecret } = theShop;
  const url = config.WISH_V3 + `/oauth/authorize?client_id=${clientId}`;
  return res.status(200).json({ url: url });
};

const applyCode = async (req, res, next) => {
  const { shop_id, code } = req.value.params;
  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const { clientId, clientSecret } = theShop;
  const url =
    config.WISH_URL_V3 +
    `/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${config.REDIRECT_URL}`;
  try {
    const { data } = await axios.get(url);
    await Shop.updateOne(
      { _id: shop_id },
      {
        $set: {
          accessToken: data.data.access_token,
          merchantId: data.data.merchant_id,
          expiredTime: data.data.expiry_time,
          refreshToken: data.data.refresh_token,
        },
      }
    );
  } catch (error) {
    throw new Error(error);
  }
  return res.status(200).json({ success: true });
};

const getDeliveryCountry = async (req, res, next) => {
  const { shop_id } = req.value.params;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const url = `${config.WISH_URL_V2}/fulfillment/get-confirmed-delivery-countries?access_token=${theShop.accessToken}&format=json`;
  // const url = 'https://merchant.wish.com/api/v2/fulfillment/get-confirmed-delivery-countries?access_token=c4924c621da748a2920b6d2d47379fa4&format=json'
  try {
    const { data } = await axios.get(url);
    return res.status(200).json(data.data);
  } catch (error) {
    return res.status(200).json(config.listCountry);
    throw axiosWishError(error);
  }
};

const getShippingCarrier = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { locale } = req.value.query;
  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const url = `${config.WISH_URL_V2}/fulfillment/get-shipping-carriers?access_token=${theShop.accessToken}&format=json&locale=${locale}`;
  // const url = 'https://merchant.wish.com/api/v2/fulfillment/get-shipping-carriers?access_token=0308b59911ac47baa62ffb896d3cfc0e&format=json&locale=' + locale
  try {
    const { data } = await axios.get(url);
    return res.status(200).json(data.data);
  } catch (error) {
    return res.status(200).json(config.listShippingUs);
    throw axiosWishError(error);
  }
};

const getAllOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { limit, start } = req.value.query;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const url = `${config.WISH_URL_V2}/order/multi-get?access_token=${theShop.accessToken}&limit=${limit}&start=${start}&format=json`;
  // const url = `${config.WISH_URL_V2}/product/fbw-sku-history?access_token=${theShop.accessToken}&format=json`
  try {
    const { data } = await axios.get(url);
    return res.status(200).json({data: data.data, count: data.data.length})
  } catch (error) {
    throw axiosWishError(error);
  }
};

const getFullFillOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { limit, start } = req.value.query;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const url = `${config.WISH_URL_V2}/order/get-fulfill?access_token=${theShop.accessToken}&limit=${limit}&start=${start}&format=json`;
  // const url = '/order/get-fulfill?access_token=50ddea33f44e4bb1a8d53f26a3496e09&format=json'
  try {
    const { data } = await axios.get(url);
    return res.status(200).json({ data: data.data, count: data.data.length });
  } catch (error) {
    throw axiosWishError(error);
  }
};

const fullFillOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { shippingCarrier, countryCode, orderId, trackingNumber } = req.value.body;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const url = `${config.WISH_URL_V2}/order/fulfill-one?access_token=${theShop.accessToken}&format=json&id=${orderId}&tracking_provider=${shippingCarrier}&tracking_number=${trackingNumber}&origin_country_code=${countryCode}`;
  // const url = '/order/get-fulfill?access_token=50ddea33f44e4bb1a8d53f26a3496e09&format=json'
  try {
    const { data } = await axios.get(url);
    return res.status(200).json({ data: data.data });
  } catch (error) {
    throw axiosWishError(error);
  }
};

const getRefreshUrl = async (req, res, next) => {
  const { shop_id } = req.value.params;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const clientId = theShop.clientId;
  const clientSecret = theShop.clientSecret;
  const refreshToken = theShop.refreshToken;
  const url = `https://sandbox.merchant.wish.com/api/v3/oauth/refresh_token?client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`;
  return res.status(200).json({ url });
};

const updateAccessToken = async (req, res, next) => {
  console.log("aaa");
  const { shop_id } = req.value.params;

  const myShop = await Shop.updateOne(
    { _id: shop_id },
    {
      $set: {
        accessToken: req.value.body.accessToken,
        expiredTime: req.value.body.expiredTime,
      },
    }
  );
  return res.status(200).json({ success: true });
};

const AutoRefreshToken = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  if (theShop) {
    const clientId = theShop.clientId;
    const clientSecret = theShop.clientSecret;
    const refreshToken = theShop.refreshToken;
    const url = `${config.REFRESH_URL}?client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`;
    try {
      const { data } = await axios.get(url);
      const newData = data.data;
      await Shop.updateOne(
        { _id: theShop._id },
        {
          $set: {
            accessToken: newData.access_token,
            expiredTime: newData.expiry_time,
          },
        }
      );
      return res
        .status(200)
        .json({
          success: true,
          accessToken: newData.access_token,
          expiredTime: newData.expiry_time,
        });
    } catch (error) {
      throw axiosWishError(error);
    }
  }
};

module.exports = {
  listShopOfUser,
  creatNewShop,
  createCodeUrl,
  applyCode,
  shopDetail,
  listStaff,
  addStaff,
  removeStaff,
  editShop,
  removeShop,
  getDeliveryCountry,
  getShippingCarrier,
  getAllOrder,
  getFullFillOrder,
  fullFillOrder,
  getRefreshUrl,
  updateAccessToken,
  AutoRefreshToken,
};

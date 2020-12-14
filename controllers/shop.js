const ShopUser = require("../models/ShopUser");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Role = require("../enums").eROLE;
const config = require("../configs");
const axios = require("axios");
const axiosWishError = require("../helpers/errorInstance").axiosWishError;
const SyncDataService = require("../services/syncData")
const moment = require("moment")
const Order = require("../models/Order")

const listShopOfUser = async (req, res, next) => {
  const limit = req.value.query.limit;
  const page = req.value.query.page;
  const skip = page * limit;
  const listShop = await ShopUser.find({
    user: req.user._id,
  })
    .populate({
      path: "shop",
      select: { name: 1, clientId: 1, clientSecret: 1, expiredTime: 1, lastSync: 1, syncStatus: 1, errorMessage: 1 },
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
  // console.log(url)
  try {
    const { data } = await axios.get(url);
    return res.status(200).json(data.data);
  } catch (error) {
    // return res.status(200).json(config.listCountry);
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
    // return res.status(200).json(config.listShippingUs);
    throw axiosWishError(error);
  }
};

const getAllOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { limit, start, order } = req.value.query;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const cond = {shopId: shop_id, shipping_provider: {$ne: null}}
  if (order) {
    cond["order_id"] = { "$regex": `.*${order}.*` }
  }
  // const url = `${config.WISH_URL_V2}/order/multi-get?access_token=${theShop.accessToken}&limit=${limit}&start=${start}&format=json`;
  // const url = `${config.WISH_URL_V2}/product/fbw-sku-history?access_token=${theShop.accessToken}&format=json`
  try {
    // const { data } = await axios.get(url);
    // return res.status(200).json({data: data.data, count: data.data.length})
    
    const result = await Order.find(cond).sort({last_updated: -1}).limit(limit).skip(start)
    const total = await Order.countDocuments(cond)
    return res.status(200).json({ data: result, count: total });
  } catch (error) {
    throw axiosWishError(error);
  }
};

const getAllShopOrder = async (req, res, next) => {
  const { limit, start, order, sort, type } = req.value.query;
  const { listShop } = req.value.body;

  const cond = {shopId: {$in: listShop}}
  if (order) {
    cond["order_id"] = { "$regex": `.*${order}.*` }
  }
  const condSort = {last_updated: -1}
  if (sort == 1) {
    condSort.last_updated = 1
  }
  if (type === "action_required") {
    cond["shipping_provider"] = null
  }
  if (type === "noted") {
    cond["isNoted"] = true
  }
  if (!type) {
    cond["shipping_provider"] = {$ne: null}
  }
  try {  
    const result = await Order.find(cond).sort(condSort).limit(limit).skip(start)
    const total = await Order.countDocuments(cond)
    return res.status(200).json({ data: result, count: total });
  } catch (error) {
    throw axiosWishError(error);
  }
};

const getFullFillOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { limit, start, order } = req.value.query;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const cond = {shopId: shop_id, shipping_provider: null}
  if (order) {
    cond["order_id"] = { "$regex": `.*${order}.*` }
  }
  // const url = `${config.WISH_URL_V2}/order/get-fulfill?access_token=${theShop.accessToken}&limit=${limit}&start=${start}&format=json`;
  // const url = '/order/get-fulfill?access_token=50ddea33f44e4bb1a8d53f26a3496e09&format=json'
  try {
    // const { data } = await axios.get(url);
    // return res.status(200).json({ data: data.data, count: data.data.length });
    const result = await Order.find(cond).sort({last_updated: -1}).limit(limit).skip(start)
    const total = await Order.countDocuments(cond)
    return res.status(200).json({ data: result, count: total });
  } catch (error) {
    throw error;
  }
};

const getNotedOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { limit, start, order } = req.value.query;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const cond = {shopId: shop_id, isNoted: true}
  if (order) {
    cond["order_id"] = { "$regex": `.*${order}.*` }
  }
  try {
    const result = await Order.find(cond).sort({last_updated: -1}).limit(limit).skip(start)
    const total = await Order.countDocuments(cond)
    return res.status(200).json({ data: result, count: total });
  } catch (error) {
    throw error;
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
  const url = `${config.WISH_URL_V2}/order/fulfill-one?access_token=${theShop.accessToken}&format=json&id=${orderId}&tracking_provider=${shippingCarrier}&origin_country_code=${countryCode}`; //&tracking_number=${trackingNumber}
  try {
    const { data } = await axios.get(url);
    await orderDetail(orderId, theShop);
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

const syncShopData = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { date } = req.value.query;
  const myShop = await Shop.findOne(
    { _id: shop_id }
  );
  if (!myShop || !myShop.accessToken) {
    throw new Error("this shop does not exist or don't have token yet");
  }
  const dateString = moment(date).format("YYYY-MM-DD")
  // console.log("dateString: ", dateString)
  const result = await SyncDataService.syncDateByDate(myShop.accessToken, dateString, myShop)
  return res.status(200).json({ success: result });
};

const noteOrder = async (req, res, next) => {
  const { shop_id, order_id } = req.value.params;
  const { isNoted } = req.value.body;
  const myOrder = await Order.findOne(
    { shopId: shop_id, order_id: order_id}
  );
  if (!myOrder) {
    throw new Error("This order does not exist");
  }
  await Order.updateOne(
    { shopId: shop_id, order_id: order_id}, {$set: {isNoted}}
  );
  return res.status(200).json({ success: true });
};

const modifyOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { shippingCarrier, countryCode, orderId, trackingNumber } = req.value.body;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  let url = `${config.WISH_URL_V2}/order/modify-tracking?access_token=${theShop.accessToken}&format=json&id=${orderId}&tracking_provider=${shippingCarrier}&origin_country_code=${countryCode}`;
  if (trackingNumber) {
    url += `&tracking_number=${trackingNumber}`
  }
  try {
    console.log(url)
    const { data } = await axios.get(url);
    // update db cho real time
    await orderDetail(orderId, theShop)
    return res.status(200).json({ data: data.data });
  } catch (error) {
    throw axiosWishError(error);
  }
}  

const refundOrder = async (req, res, next) => {
  const { shop_id } = req.value.params;
  const { reasonCode, orderId } = req.value.body;

  const theShop = await Shop.findOne({
    _id: shop_id,
  });
  if (!theShop) {
    throw new Error("this shop does not exist");
  }
  const url = `${config.WISH_URL_V2}/order/refund?reason_code=${reasonCode}&id=${orderId}&access_token=${theShop.accessToken}`;
  try {
    const { data } = await axios.get(url);
    // update db cho real time
    await orderDetail(orderId, theShop)
    return res.status(200).json({ data: data.data });
  } catch (error) {
    throw axiosWishError(error);
  }
}

const orderDetail = async (orderId, theShop) => {
  const url = `https://merchant.wish.com/api/v2/order?id=${orderId}&access_token=${theShop.accessToken}&show_original_shipping_detail=True`
  const { data } = await axios.get(url);
  await Order.updateOne({_id: orderId} , {$set: data["Order"]})
}

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
  syncShopData,
  getNotedOrder,
  noteOrder,
  refundOrder,
  modifyOrder,
  getAllShopOrder
};

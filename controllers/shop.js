const ShopUser = require("../models/ShopUser");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Role = require("../enums").eROLE;
const config = require("../configs");
const axios = require("axios");

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
    await ShopUser.deleteMany({shop: shop_id});
    await ShopUser.deleteOne({_id: shop_id})
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
  console.log(req.value.params);
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
    throw error;
  }
  return res.status(200).json({ success: true });
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
};

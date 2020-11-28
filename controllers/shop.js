const ShopUser = require("../models/ShopUser")
const Shop = require("../models/Shop")
const Role = require("../enums").eROLE
const config = require("../configs")
const axios = require("axios")

const listShopOfUser = async (req, res, next) => {
    const limit = req.value.query.limit;
    const page = req.value.query.page;
    const skip = page * limit;
    const listShop = await ShopUser.find({
        user: req.user._id,
    }).populate('Shop', { name: 1, _id: 1 })
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

const creatNewShop = async (req, res, next) => {
    const newShop = await Shop.create({
        name: req.value.body.name,
        created_by: req.user._id,
        clientSecret: req.value.body.clientSecret,
        clientId: req.value.body.name.clientId,
    })
    const newShopUser = await ShopUser.create({
        user: req.user._id,
        shop: newShop._id,
        role: Role.admin
    })
    return res.status(201).json(newShopUser)
}

const createCodeUrl = async (req, res, next) => {
    const { shop_id } = req.value.params;
    const theShop = await Shop.findOne({
        _id: shop_id,
    });
    const {clientId, clientSecret} = theShop
    const url = config.WISH_URL_V3 + `/oauth/authorize?client_id=${clientId}`
    return res.status(200).json({ url: url });
}

const applyCode = async (req, res, next) => {
    const { code } = req.value.params;
    const theShop = await Shop.findOne({
        _id: shop_id,
    });
    const {clientId, clientSecret} = theShop
    const url = config.WISH_URL_V3 + `/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${config.REDIRECT_URL}`
    try {
        const response = await axios.get(url)
        await Shop.updateOne({_id: shop_id}, {$set: {
            accessToken: reponse.accessToken,
            merchantId: response.merchantId,
            expiredTime: response.expiredTime,
            refreshToken: response.refreshToken
        }})
    } catch (error) {
        throw error
    }
    return res.status(200).json({ success: true});
}

module.exports = {
    listShopOfUser,
    creatNewShop,
    createCodeUrl,
    applyCode
}
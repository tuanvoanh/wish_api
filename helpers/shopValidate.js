const ShopUser = require("../models/ShopUser");
const Role = require("../enums").eROLE;

const isAdmin = async (req, res, next) => {
    const { shop_id } = req.value.params;
    const user = req.user;
    console.log({user: user._id, shop: shop_id})
    const shopUser = await ShopUser.findOne({user: user._id, shop: shop_id})
    if (!shopUser && shopUser.role !== Role.admin) {
        return res.status(401).json({error: { message: "Unauthorized" }})
    }
    next();
}

const isSuperAdmin = async (req, res, next) => {
    const user = req.user;
    if (user.role !== Role.admin) {
        return res.status(401).json({error: { message: "Unauthorized" }})
    }
    next();
}


const isMember = async (req, res, next) => {
    const { shop_id } = req.value.params;
    const user = req.user;
    const shopUser = await ShopUser.findOne({user: user._id, shop: shop_id})
    if (!shopUser) {
        return res.status(401).json({error: { message: "Unauthorized" }})
    }
    next();
}

module.exports = {
    isAdmin,
    isMember,
    isSuperAdmin
}
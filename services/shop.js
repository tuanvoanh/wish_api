const ShopUser = require("../models/ShopUser");
const Shop = require("../models/Shop");
const eSYNC_STATUS = require("../enums").eSYNC_STATUS
const User = require("../models/User");
const Role = require("../enums").eROLE;
const config = require("../configs");
const axios = require("axios");
const axiosWishError = require("../helpers/errorInstance").axiosWishError;
const SyncDataService = require("../services/syncData")
const moment = require("moment")
const Order = require("../models/Order")

const getScheduleShop = async () => {
    return await Shop.find({syncStatus: {$ne: eSYNC_STATUS.unSync}})
}

module .exports = {
    getScheduleShop
}
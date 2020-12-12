const config = require("../configs");
const axios = require("axios");
const ShopUser = require("../models/ShopUser");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Order = require("../models/Order");
const { array } = require("@hapi/joi");
const eSYNC_STATUS = require("../enums").eSYNC_STATUS;

const syncDateByDate = async (accessToken, fromDate, shopInstance) => {
  // change status to syncing
  shopInstance.lastSync = new Date();
  if (shopInstance.syncStatus == eSYNC_STATUS.unSync) {
    shopInstance.syncStatus = eSYNC_STATUS.syncing;
  }
  await shopInstance.save();
  let start = 0;
  let limit = 5;
  let errorMessage = "";
  const since = fromDate;
  while (1) {
    const url = `${config.WISH_URL_V2}/order/multi-get?access_token=${accessToken}&limit=${limit}&start=${start}&since=${since}&format=json`;
    console.log("url: ", url);
    try {
      const { data } = await axios.get(url);
      const result = data.data;
      const orderList = result.map((item) => item["Order"]);
      if (orderList.length == 0) {
        break;
      } else {
        console.log("Update data: ", orderList.length);
        await updateBulkOrder(orderList, shopInstance._id)
      }
      if (result.length < limit) {
        break;
      }
      start = start + limit;
    } catch (error) {
      if (error.response) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = error;
      }
      break;
    }
  }
  if (errorMessage) {
    console.log("error sync");
    shopInstance.errorMessage = errorMessage;
    shopInstance.syncStatus = eSYNC_STATUS.error;
    await shopInstance.save();
    return false;
  }
  if ((shopInstance.syncStatus = eSYNC_STATUS.syncing)) {
    shopInstance.syncStatus = eSYNC_STATUS.schedule;
  }
  shopInstance.errorMessage = errorMessage;
  await shopInstance.save();
  return true;
};

const prepareBulkData = (orderList, shopId) => {
  const listBulk = [];
  for (let order of orderList) {
    listBulk.push({
      updateOne: {
        filter: { order_id:  order.order_id},
        update: {$set: {...order, shopId: shopId}},
        upsert: true,
      },
    });
  }
  return listBulk;
};


const updateBulkOrder = async (orderList, shopId) => {
    const bulkList = prepareBulkData(orderList, shopId)
    await Order.bulkWrite(bulkList)
}
module.exports = {
  syncDateByDate,
};

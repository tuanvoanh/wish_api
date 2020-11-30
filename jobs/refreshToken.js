const moment = require("moment");
const CronJob = require("cron").CronJob;
const Shop = require("../models/Shop");
const axios = require("axios");

// var job = new CronJob('0 12 * * *', function() {
const job = new CronJob("*/10 * * * *", async function () {
  console.log("=== REFRESH TOKEN JOB START === ", moment().utc());
  const theShop = await Shop.findOne({
      expiredTime: {$ne: null},
      expiredTime: {$lt: moment().add(2, 'day')}
  })
  if (theShop) {
    const clientId = theShop.clientId;
    const clientSecret = theShop.clientSecret;
    const refreshToken = theShop.refreshToken;
    const url = `https://sandbox.merchant.wish.com/api/v3/oauth/refresh_token?client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`
    try {
        const { data } = await axios.get(url);
        const newData = data.data
        await Shop.updateOne({ _id: theShop._id }, { $set: {
            accessToken: newData.access_token,
            expiredTime: newData.expiry_time,
        }})
    } catch (error) {
        console.log("error: ", error.response)
    }
  }
  console.log("=== REFRESH TOKEN JOB DONE === ", moment().utc());
});

// job.start();

const listCountry = require("../configs/contriesList.json");
const listShippingUs = require("../configs/listShippingUs.json");

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost/nodejsapistarter",
  TEAM_EMAIL: process.env.TEAM_EMAIL,
  BASE_URL: process.env.BASE_URL,
  PORT: process.env.PORT,
  WISH_V3: process.env.WISH_V3 || "https://sandbox.merchant.wish.com/v3",
  WISH_URL_V3: process.env.WISH_URL_V3 || "https://sandbox.merchant.wish.com/api/v3",
  WISH_URL_V2: process.env.WISH_URL_V2 || "https://sandbox.merchant.wish.com/api/v2",
  REDIRECT_URL: process.env.REDIRECT_URL || "https://www.google.com.vn",
  listCountry: listCountry,
  listShippingUs: listShippingUs,
}
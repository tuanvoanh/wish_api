const mongoose = require('mongoose')

const ShopSchema = new Schema({
    name: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    clientSecret: { type: String },
    clientId: { type: String },
    code: { type: String, optional: true },
    accessToken: { type: String, optional: true },
    merchantId: { type: String, optional: true },
    expiredTime: { type: Date, optional: true },
    refreshToken: { type: String, optional: true },
})

const Shop = mongoose.model('Shop', ShopSchema)
module.exports = Shop
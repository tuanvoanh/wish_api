const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ShopUserSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    role: { type: String }
}) 

const ShopUser = mongoose.model('ShopUser', ShopUserSchema)
module.exports = ShopUser
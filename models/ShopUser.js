const mongoose = require('mongoose')

const ShopUserSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    role: { type: String }
}) 

const ShopUser = mongoose.model('Shop', ShopUserSchema)
module.exports = ShopUser
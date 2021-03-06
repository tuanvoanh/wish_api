const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OrderSchema = new Schema({
    isNoted: {type: Boolean, default: false},
    last_updated: {type: String, index: true},
    order_time: {type: String, index: true},
    shopId: {type: String, index: true},
}, {strict: false})
OrderSchema.index({ shopId: 1, state: 1});
const Order = mongoose.model('Order', OrderSchema)
module.exports = Order
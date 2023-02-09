const mongoose = require('mongoose')
const Schema = mongoose.Schema
const orderSchema = new Schema({
    books: [
      {
        book: {
          type: Schema.Types.ObjectId,
          ref: "Book",
        },
        quantity: Number,
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
});

module.exports = mongoose.model('Order',orderSchema)
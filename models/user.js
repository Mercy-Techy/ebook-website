const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  admin:{
    type:Boolean,
    default:false
  },
  orders:[
      {
          type:Schema.Types.ObjectId,
          ref:'Order'
      }
  ],
  cart: {
    books: [
      {
        book: {
          type: Schema.Types.ObjectId,
          ref: "Book",
        },
        quantity: Number,
      },
    ],
    totalPrice:{
        type:Number,
        default:0
    }
  }
});

module.exports = mongoose.model('User',userSchema)
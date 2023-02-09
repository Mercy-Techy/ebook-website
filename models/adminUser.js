const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminUserSchema = new Schema({
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
  adminOTP: Number,
  admin:{
    type:Boolean,
    default:true
  },
  createdBooks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Book",
    },
  ],
  orders: [
    {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
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
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
});

module.exports = mongoose.model("adminUser", adminUserSchema);

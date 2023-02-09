const Book = require("../models/book");
const User = require("../models/user");
const adminUser = require("../models/adminUser");
const Order = require("../models/order");

exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json({ books: books });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.getBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await Book.findOne({ _id: bookId });
    if (!book) {
      const error = new Error("book not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(201).json({ book: book });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    let user;
    if (req.admin) {
      user = await adminUser.findById(req.userId).populate({
        path: "cart",
        populate: { path: "books", populate: { path: "book" } },
      });
    } else {
      user = await User.findById(req.userId).populate({
        path: "cart",
        populate: { path: "books", populate: { path: "book" } },
      });
    }
    res.status(200).json({ cart: user.cart, email: user.email });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  const bookId = req.params.bookId;
  const amount = Number(req.params.amount);
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error("book not found");
      error.statusCode = 404;
      throw error;
    }
    if (amount < 1) {
      const error = new Error("Invalid Quantity");
      error.statusCode = 404;
      throw error;
    }
    let user;
    if (req.admin) {
      user = await adminUser.findById(req.userId).populate({
        path: "cart",
        populate: { path: "books", populate: { path: "book" } },
      });
    } else {
      user = await User.findById(req.userId).populate({
        path: "cart",
        populate: { path: "books", populate: { path: "book" } },
      });
    }
    const foundBook = user.cart.books.find(
      (bk) => bk.book._id.toString() === bookId.toString()
    );
    if (foundBook) {
      const foundBookIndex = user.cart.books.findIndex(
        (bk) => bk.book._id.toString() === bookId.toString()
      );
      user.cart.books[foundBookIndex].quantity += amount;
      user.cart.totalPrice += amount * foundBook.book.price;
      await user.save();
      return res.status(200).json({ cart: user.cart });
    }
    user.cart.books.push({ book: book, quantity: amount });
    user.cart.totalPrice += book.price * amount;
    await user.save();
    res.status(200).json({ cart: user.cart });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteCart = async (req, res, next) => {
  try {
    let user;
    if (req.admin) {
      user = await adminUser.findById(req.userId);
    } else {
      user = await User.findById(req.userId);
    }
    user.cart.books = [];
    user.cart.totalPrice = 0;
    await user.save();
    res.status(200).json({ message: "done" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  const bookId = req.params.bookId;
  const amount = Number(req.params.amount);
  try {
    let user;
    if (req.admin) {
      user = await adminUser.findById(req.userId).populate({
        path: "cart",
        populate: { path: "books", populate: { path: "book" } },
      });
    } else {
      user = await User.findById(req.userId).populate({
        path: "cart",
        populate: { path: "books", populate: { path: "book" } },
      });
    }
    const cart = user.cart.books.find(
      (cart) => cart.book._id.toString() === bookId.toString()
    );
    const cartIndex = user.cart.books.findIndex(
      (cart) => cart.book._id.toString() === bookId.toString()
    );
    if (!cart) {
      const error = new Error("Book not found");
      error.statusCode = 404;
      throw error;
    }
    if (amount > cart.quantity) {
      const error = new Error("Quantity is greater than cart's quantity");
      error.statusCode = 401;
      throw error;
    }
    if (cart.quantity > amount) {
      cart.quantity -= amount;
      user.cart.totalPrice -= amount * cart.book.price;
      user.cart.books[cartIndex] = cart;
      await user.save();
      return res.status(200).json({ cart: user.cart });
    }
    user.cart.totalPrice -= cart.quantity * cart.book.price;
    user.cart.books.pull(cart);
    await user.save();
    res.status(200).json({ cart: user.cart });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.order = async (req, res, next) => {
  const reference = Number(req.body.reference);
  let user;
  if (req.admin) {
    user = await adminUser.findById(req.userId).populate({
      path: "cart",
      populate: { path: "books", populate: { path: "book" } },
    });
  } else {
    user = await User.findById(req.userId).populate({
      path: "cart",
      populate: { path: "books", populate: { path: "book" } },
    });
  }
  const resp = await fetch(
    "https://api.paystack.co/transaction/verify/" + reference,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + process.env.PAYSTACK,
      },
    }
  );
  const result = await resp.json();
  const data = result.data;
  if (Number(data.reference) === Number(reference) && result.status) {
    if (data.status === "success") {
      const order = new Order({
        books: user.cart.books,
        totalPrice: user.cart.totalPrice,
        userId: user._id,
      });
      const savedOrder = await order.save();
      console.log(savedOrder);
      user.orders.push(savedOrder);
      user.cart.books = [];
      user.cart.totalPrice = 0;
      await user.save();
      return res.status(200).json({ order: savedOrder });
    }
    return res.status(422).json({ message: "Transaction Failed" });
  } else {
    return res.status(500).json({ message: "Sorry there was an error" });
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    let user;
    if (req.admin) {
      user = await adminUser.findById(req.userId).populate("orders");
    } else {
      user = await User.findById(req.userId).populate("orders");
    }
    res.status(200).json({ orders: user.orders });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteOrders = async (req, res, next) => {
  try {
    let user;
    if (req.admin) {
      user = await adminUser.findById(req.userId);
    } else {
      user = await User.findById(req.userId);
    }
    user.orders.forEach(async (order) => {
      await Order.findByIdAndRemove(order);
    });
    user.orders = [];
    await user.save();
    res.status(200).json({ message: "done" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const { validationResult } = require("express-validator/check");
const path = require('path')
const fs = require('fs')

const adminUser = require("../models/adminUser");
const Book = require("../models/book");
const cloudinary = require('../helper/cloudinary')


exports.createBook = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    if (!req.admin) {
      const error = new Error("Only Admins are Permitted to Create Products");
      error.statusCode = 404;
      throw error;
    }
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed,entered data is incorrect");
      error.statusCode = 422;
      throw error;
    }
    if (!req.file) {
      const error = new Error("No image provided");
      error.statusCode = 422;
      throw error;
    }
    const title = req.body.title;
    const author = req.body.author;
    const price = req.body.price;
    const description = req.body.description;
    const category = req.body.category;
    const bestseller = req.body.bestSeller;
    const creator = req.userId;
    const imageUrl = await cloudinary.uploader.upload(req.file.path,{
        width:500,
        height:500,
        crop:'fill'
    })
    const book = new Book({
      title: title,
      author: author,
      price: price,
      description: description,
      category: category,
      bestseller: bestseller,
      creator: creator,
      imageUrl: imageUrl.url,
      imageId:imageUrl.public_id
    });
    const createdBook = await book.save();
    const user = await adminUser.findById(req.userId);
    user.createdBooks.push(createdBook);
    await user.save();
    res.status(200).json({ book: createdBook });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.editBook = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    if (!req.admin) {
      const error = new Error("Only Admins are Permitted to Edit Products");
      error.statusCode = 422;
      throw error;
    }
    if (!errors.isEmpty()) {
      const error = new Error();
      error.message = errors.array()[0].msg
      error.statusCode = 422;
      throw error;
    }
    const bookId = req.params.bookId;
    const title = req.body.title;
    const author = req.body.author;
    const price = req.body.price;
    const description = req.body.description;
    const category = req.body.category;
    const bestseller = req.body.bestSeller;
    const book = await Book.findOne({ _id: bookId });
    if (!book) {
      const error = new Error("book not found");
      error.statusCode = 404;
      throw error;
    }
    if (book.creator.toString() !== req.userId.toString()) {
      const error = new Error("Not Permitted To Modify Products You Didn't Create");
      error.statusCode = 401;
      throw error;
    }
    book.title = title;
    book.author = author;
    book.price = book.price;
    book.description = description;
    book.category = category;
    book.price = price;
    book.bestseller = bestseller;
    if (req.file) {
      const imageUrl = await cloudinary.uploader.upload(req.file.path, {
        public_id: book.imageId,
        width: 500,
        height: 500,
        crop: "fill",
      });
      book.imageUrl = imageUrl.url;
    }
    const editedBook = await book.save();
    res.status(201).json({ book: editedBook });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    if (!req.admin) {
      const error = new Error("Only Admins are Permitted to Delete Products");
      error.statusCode = 422;
      throw error;
    }
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error("book not found");
      error.statusCode = 404;
      throw error;
    }
    if (book.creator.toString() !== req.userId.toString()) {
      const error = new Error("Not Permitted To Modify Products You Didn't Create");
      error.statusCode = 401;
      throw error;
    }
    await cloudinary.uploader.destroy(book.imageId)
    await Book.findByIdAndRemove(bookId);
    const user = await adminUser.findById(req.userId);
    user.createdBooks.pull(book._id);
    await user.save();
    res.status(200).json({ message: "Book deleted" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};


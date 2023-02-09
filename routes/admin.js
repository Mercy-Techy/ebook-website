const express = require('express')
const {body} = require('express-validator/check')
const router = express.Router()

const adminController = require('../controllers/admin')
const isAuth = require("../middleware/authenticated");

router.post(
  "/createbook",
  isAuth,
  [
    body("title").trim().isLength({ min: 3 }),
    body("author").trim().isLength({ min: 3 }),     
    body("description").trim().isLength({ min: 3 }),
    body("category").trim().isLength({ min: 3 }),
    body("price").isNumeric(),
    body("bestSeller").isBoolean(),
  ],
  adminController.createBook
);
 
router.post(
  "/editbook/:bookId",
  isAuth,
  [
    body("title", "title should be a minimum of three character")
      .trim()
      .isLength({ min: 3 }),
    body("author").trim().isLength({ min: 3 }),
    body("description").trim().isLength({ min: 3 }),
    body("category").trim().isLength({ min: 3 }),
    body("price").isNumeric(),
  ],
  adminController.editBook
);

router.delete("/deletebook/:bookId", isAuth, adminController.deleteBook);

module.exports = router
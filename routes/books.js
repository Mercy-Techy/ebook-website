const express = require('express')
const {body} = require('express-validator/check')

const booksController = require('../controllers/books')
const isAuth = require('../middleware/authenticated')

const router = express.Router()

router.get('/getbooks',booksController.getBooks)
   
router.get('/getbook/:bookId',booksController.getBook)

router.get('/getcart',isAuth,booksController.getCart)

router.post("/addtocart/:bookId/:amount", isAuth, booksController.addToCart);

router.delete("/removefromcart/:bookId/:amount", isAuth, booksController.removeFromCart);

router.delete("/deletecart",isAuth,booksController.deleteCart)

router.post('/order',isAuth,booksController.order)

router.get("/getorder", isAuth, booksController.getOrder);

router.delete("/deleteorders", isAuth, booksController.deleteOrders);



module.exports = router  
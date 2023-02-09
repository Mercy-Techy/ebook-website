const express = require('express')
const{body} = require('express-validator/check')

const authController = require('../controllers/auth')
const User = require('../models/user')
const adminUser = require('../models/adminUser')

const router = express.Router()

router.put('/signup',[
 body('name','Name is too short').trim().isLength({min:3}),
 body('password','Password must be longer than 4 characters').trim().isLength({min:5}),
 body('email').isEmail().custom((value,{req})=>{
    return User.findOne({email:value}).then(userDoc=>{
       return adminUser.findOne({email:value}).then(adminDoc=>{
         if (userDoc || adminDoc) {
           return Promise.reject("Email exist already");
         }
       })
    }) 
 }).normalizeEmail()
],authController.signup)

router.post('/login',authController.login)

router.patch("/getotp", authController.getOTP);

module.exports = router
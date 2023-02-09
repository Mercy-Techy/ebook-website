const { validationResult } = require("express-validator/check");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const rn = require("random-number");

const User = require("../models/user");
const adminUser = require("../models/adminUser");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "oluwagbemiro65@gmail.com",
    pass: process.env.GMAIL_PASSCODE,
  },
});

exports.getOTP = async (req, res, next) => {
  const email = req.body.email;
  try {
    const user = await adminUser.findOne({ email: email });
    if (!user) {
      const error = new Error("Admin does not exist");
      error.statusCode = 403;
      throw error;
    }
    const generator = rn.generator({
      min: 1000,
      max: 9999,
      integer: true,
    });
    console.log('hi')
    const OTP = generator();
    user.adminOTP = OTP;
    await user.save();
    transporter.sendMail({
      to: email,
      from: "oluwagbemiro65@gmail.com",
      subject: "OTP",
      html: `
        <h2 style="color: purple;">${OTP} is the OTP you need to login as an admin</h2>
        `,
    });
    res.status(200).json({ message: "Sent!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error();
      error.message = errors.array()[0].msg;
      error.statusCode = 422;
      throw error;
    }
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const admin = req.body.admin;
    const hashedPassword = await bcrypt.hash(password, 12);
    let signedUser;
    if (admin) {
      const aduser = new adminUser({
        name: name,
        email: email,
        password: hashedPassword,
      });
      signedUser = await aduser.save();
    } else {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
      });
      signedUser = await user.save();
    }
    res.status(200).json({ user: signedUser });
    transporter.sendMail({
      to: email,
      from: "oluwagbemiro65@gmail.com",
      subject: "Successfully signed up",
      html: `
            <h3>Congratulations ${signedUser.name}, you successfully signed up </h3> <br>
            <img src="https://media.istockphoto.com/id/621827458/photo/celebrating-our-achievements-together.jpg?s=612x612&w=0&k=20&c=6gAIX9rnTq3ok50u7Mvzr8OyV4_K66ss2g2MCh-Tvp8=" alt="my image" >
            `,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const password = req.body.password;
  const email = req.body.email;
  const OTP = Number(req.body.OTP);
  let isAdmin;
  let user
  try {
    if (OTP) {
      user = await adminUser.findOne({ email: email });
      if (!user) {
        const error = new Error("You are not an admin");
        error.statusCode = 403;
        throw error;
      }
      if (user.adminOTP !== OTP) {
        const error = new Error("You are not an admin");
        error.statusCode = 403;
        throw error;
      }
      isAdmin = true;
    } else {
       user = await User.findOne({ email: email });
      if (!user) {
        const error = new Error("User does not exist");
        error.statusCode = 403;
        throw error;
      }
    }
    const comparedPw = await bcrypt.compare(password, user.password);
    if (!comparedPw) {
      const error = new Error("Invalid password");
      error.statusCode = 403;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
        admin: isAdmin ? true : false,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.status(200).json({ user: user, token: token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

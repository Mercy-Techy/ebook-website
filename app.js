const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const multer = require('multer')
// const {v4:uuidv4} = require('uuid')
const path = require('path')
require('dotenv').config()

const booksRouter = require('./routes/books')
const authRouter = require('./routes/auth')
const adminRouter = require('./routes/admin')

const app = express()

// const PORT = 5000
const fileStorage = multer.diskStorage({})
const fileFilter = (req,file,cb)=>{
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false); 
    }
}

app.use(bodyParser.json());
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))


app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader("Access-Control-Allow-Methods",'GET,POST,PUT,PATCH,DELETE');
  res.setHeader("Access-Control-Allow-Headers",'Content-Type,Authorization');
  next()
})

// app.use("/images", express.static(path.join(__dirname, "images")));


app.use('/book',booksRouter) 
app.use('/auth',authRouter)
app.use('/admin',adminRouter)

app.use((error,req,res,next)=>{
  // console.log(error)
     const statusCode = error.statusCode || 500 
     res.status(statusCode).json({message:error.message})
})

mongoose
  .connect(process.env.DATABASE_API, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`app listening at port 5000`);
    });
  })
  .catch((err) => console.log(err));
 
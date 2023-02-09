const mongoose = require('mongoose')

const Schema = mongoose.Schema

const bookSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    author:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    }, 
    category:{
        type:String,
        required:true
    },
    bestseller:{
        type:Boolean,
        required:true
    },
    imageUrl:{
        type:String,
        require:true
    },
    imageId:{
        type:String,
        require:true
    },
    creator:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"user"
    }
})

module.exports = mongoose.model('Book',bookSchema)
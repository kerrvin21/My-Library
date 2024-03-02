const mongoose = require('mongoose')
const path = require('path')

const coverImageBasePath = 'uploads/bookCovers/'

const schema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    publishDate: {
        type: Date,
        required: true
    },
    pageCount: {
        type: Number,
        require: true,
        min: 1
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    coverImageName: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'author'
    }
})

schema.virtual('coverImagePath').get(function () {
    if (this.coverImageName != null)
        return path.join('/', coverImageBasePath, this.coverImageName)
})


module.exports = new mongoose.model('book', schema)
module.exports.coverImageBasePath = coverImageBasePath
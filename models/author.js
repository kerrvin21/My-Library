const mongoose = require('mongoose')
const Book = require('./book')

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})


schema.pre('deleteOne', async function (next) {
    let books;
    try {
        books = await Book.find({author: this.getQuery()._id})
        if (books.length > 0) next(new Error('This Author has books still'))
        next()
    } catch (error) {
        next(error)
    }
})

module.exports = mongoose.model('author', schema)
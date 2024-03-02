const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const Book = require('../models/book.js')
const Author = require('../models/author.js')

const uploadPath = path.join('public', Book.coverImageBasePath)
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

const router = express.Router()
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})

function DeleteFileUpload(fileName) {
    fs.unlink(uploadPath + fileName, err => {
        if (err)
            console.error(err)
    })
}

async function renderNewPage(res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        let params = {
            book: book, authors: authors
        }
        if (hasError) params.errorMessage = 'Error Creating Book'
        res.render('books/new', params)
    } catch (error) {
        console.log(error)
        res.redirect('/books')
    }
}

router.get('/', async (req, res) => {
    let query = Book.find()

    if (req.query.title != null && req.query.title != '')
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    if (req.query.publishBefore != null && req.query.publishBefore != '')
        query = query.lte('publishDate', req.query.publishBefore)
    if (req.query.publishAfter != null && req.query.publishAfter != '')
        query = query.gte('publishDate', req.query.publishAfter)
    const books = await query.exec()
    try {
        res.render('books/index', {
            books: books,
            searchParams: req.query
        })
    } catch (error) {

    }
})
router.get('/new', (req, res) => {
    renderNewPage(res, new Book())
})
router.post('/', upload.single('coverImageName'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    })
    try {
        await book.save()
        // res.render(`books/${book._id}`)
        res.render('books')
    } catch (error) {
        if (fileName != null) DeleteFileUpload(fileName)
        console.log(error)
        renderNewPage(res, book, true)
    }
})




module.exports = router
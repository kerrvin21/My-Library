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

async function SaveRecord(req, res, isUpdate = false) {
    const fileName = req.file != null ? req.file.filename : null
    let oldRecord;
    let newBook = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: req.body.publishDate === '' ? null : new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    })
    const options = {
        runValidators: true, // runs validators from model
        upsert: true, // insert document if not found
        new: true, // return the updated value
        setDefaultOnInsert: true // (runs when upsert is true) new docs created? defaults from model will be defaulted
    }

    try {
        console.log(isUpdate)
        if (isUpdate) {
            oldRecord = await Book.findById(req.params.id)
            newBook._id = oldRecord._id
            if (fileName === null) newBook.coverImageName = oldRecord.coverImageName
        }
        newBook = await Book.findByIdAndUpdate(newBook._id, newBook, options)

        if (isUpdate && newBook.coverImageName != oldRecord.coverImageName) {
            DeleteFileUpload(oldRecord.coverImageName)
        }
        res.redirect(`/books/${newBook._id}`)
    } catch (error) {
        if (fileName != null) DeleteFileUpload(fileName)
        RenderFormPage(res, newBook, isUpdate, { message: error, repopulate: true })
    }
}

async function RenderFormPage(res, book, isUpdateAction = false, error = { message: null, repopulate: false }) {
    let authors = []
    try {
        authors = await Author.find({})
        if (!error.repopulate && error.message != null) {
            console.log(error)
            throw new Error(error.message)
        }
        if (authors.length <= 0) {
            throw new Error('No authors found. Try adding author first')
        }
        res.render('books/new', {
            book,
            authors,
            PageInfo: {
                title: isUpdateAction ? 'Update Book Record' : 'Create new Book',
                actionLink: isUpdateAction ? `/books/${book.id}?_method=PUT` : '/books',
                action: isUpdateAction ? 'Update' : 'Create'
            },
            errorMessage: error.message != null ? error.message : ''
        })
    } catch (error) {
        res.render('books', {
            books: [],
            searchParams: {},
            errorMessage: error
        })
    }
}

async function RenderIndexPage(req, res) {
    let query = Book.find()
    let books = []
    console.log(req.query)
    console.log(req.body)
    if (req.query.title != null && req.query.title != '')
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    if (req.query.publishBefore != null && req.query.publishBefore != '')
        query = query.lte('publishDate', req.query.publishBefore)
    if (req.query.publishAfter != null && req.query.publishAfter != '')
        query = query.gte('publishDate', req.query.publishAfter)
    try {
        books = await query.exec()
        res.render('books', {
            books: books,
            searchParams: req.query,
            // errorMessage: error
        })
    } catch (error) {
        console.log(error)
        res.render('books', { books, searchParams: req.query, errorMessage: error })
    }
}

router.get('/', async (req, res) => {
    RenderIndexPage(req, res)
})

//CREATE
router.get('/new', (req, res) => {
    RenderFormPage(res, new Book(), false, { message: null, repopulate: false })
})

//VIEW
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        if (book == null) throw new Error('Couldnt find the record')
        res.render('books/view', { book })
    } catch (error) {
        RenderIndexPage(req, res, error)
    }
})

//EDIT
router.get('/edit/:id', async (req, res) => {
    let book = null
    let errorMessage = null
    try {
        book = await Book.findById(req.params.id)
    } catch (error) {
        errorMessage = error.message
    }
    RenderFormPage(res, book, true, { message: errorMessage, repopulate: false })
})

router.post('/', upload.single('coverImageName'), (req, res) => SaveRecord(req, res, false))

router.put('/:id', upload.single('coverImageName'), (req, res) => SaveRecord(req, res, true))


router.delete('/:id', async (req, res) => {
    let error
    try {
        const book = await Book.findById(req.params.id)
        if (book == null) throw new Error('Record doesn\'t exist.')
        await book.deleteOne()
        DeleteFileUpload(book.coverImageName)
    } catch (error) {
        error = error
        console.log(error)
    }
    res.redirect('/books')
})




module.exports = router
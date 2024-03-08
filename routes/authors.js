const express = require('express')
const Author = require('../models/author')
const Book = require('../models/book')
const router = express.Router()

function RenderForm(req, res, record, isUpdate = false, error = null) {
    let action = isUpdate ? 'Update' : 'Create'
    let action_link = isUpdate ? `/authors/${record.id}?_method=PUT` : '/authors'
    let params = { author: record, action, action_link }
    if (error != null) params.errorMessage = error
    res.render('authors/new', params)
}

async function RenderIndexPage(res, searchPattern = '', errorMessage = null) {
    let authors = []
    let searchAuthorPattern = {}
    let pageParams = { author: {}, name: searchPattern }
    if (searchPattern != '' || searchPattern != null)
        searchAuthorPattern.name = new RegExp(searchPattern, 'i')

    try {
        authors = await Author.find(searchAuthorPattern)
        res.render('authors', { authors, searchOptions: pageParams, errorMessage: errorMessage })
    } catch (error) {
        res.render('authors', { authors, searchOptions: params.query, errorMessage: error })
    }

}

router.get('/', async (req, res) => {
    RenderIndexPage(res, req.query.name)
})

router.get('/new', (req, res) => {
    RenderForm(req, res, new Author({ name: '' }))
})

router.get('/edit/:id', async (req, res) => {
    let id = req.params.id
    try {
        const author = await Author.findById(id)
        if (author == null) throw new Error('No record found')
        RenderForm(req, res, author, true)
    } catch (error) {
        console.error(error)
    }
})

router.get('/:id', async (req, res) => {
    const id = req.params.id
    try {
        const author = await Author.findById(id)
        const books = await Book.find({ author: id })
        res.render('authors/view', { author: author, books: books })
    } catch (error) {
        console.error(error)
        res.redirect('/authors')
    }

})

router.post('/', async (req, res) => {
    let author = new Author({
        name: req.body.name
    })
    try {
        if (req.body.name == null || req.body.name == '') throw new Error('Name is required')
        author = await author.save()
        res.redirect(`authors/${author.id}`)
    } catch (error) {
        console.error(error)
        RenderForm(req, res, author, false, error)
        // res.render('authors/new', { author: author, errorMessage: error.message, action_link: '/authors' })
    }
})

router.put('/:id', async (req, res) => {
    let author = null
    try {
        author = await Author.findById(req.params.id)
        if (String(req.body.name).trim() == '' || req.body.name == undefined)
            throw new Error('Invalid name')
        console.log(author)
        author.name = req.body.name
        await author.save()
        res.redirect(`/authors/${author._id}`)
    } catch (error) {
        RenderForm(req, res, author, true, error)
    }
})


router.delete('/:id', async (req, res) => {
    let errorG = null
    try {
        const author = await Author.findById(req.params.id)
        await author.deleteOne()
    } catch (error) {
        errorG = error
    }
    RenderIndexPage(res, '', errorG)

})

module.exports = router
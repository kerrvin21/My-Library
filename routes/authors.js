const express = require('express')
const Author = require('../models/author')
const router = express.Router()

router.get('/', async (req, res) => {
    let searchOptions = {}
    if (req.query.name != null && req.query.name !== '')
        searchOptions.name = new RegExp(req.query.name, 'i') //has a 
    try {
        const authors = await Author.find(searchOptions)
        res.render('authors/index', { authors: authors, searchOptions: req.query })
    } catch (error) {
        console.error(error)
        res.redirect('/')
    }
})

router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Author({ name: '' }) })
})

router.post('/', async (req, res) => {
    let author = new Author({
        name: req.body.name
    })
    try {
        author = await author.save()
        // res.render(`authors/${author.id}`)
        res.redirect('authors')
    } catch (error) {
        console.error(error)
        res.render('authors/new', { author: author, errorMessage: error.message })
    }



})

module.exports = router
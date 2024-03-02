if (process.env.NODE_ENV !== 'production')
    require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const indexRouter = require('./routes/index.js')
const AuthorRouter = require('./routes/authors')
const BookRouter = require('./routes/books')
const expressLayouts = require("express-ejs-layouts")

const app = express()

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')

app.use(expressLayouts)
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection

db.on('error', error => console.error(error))
db.once('open', () => console.log('connected to mongoose'))

app.use('/', indexRouter)
app.use('/authors', AuthorRouter)
app.use('/books', BookRouter)


app.listen(process.env.PORT || 3000)
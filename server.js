'use strict';

// dependancies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();

// App setup
const app = express();
const PORT = process.env.PORT;

// middle ware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const client = new pg.Client(process.env.DATABASE_URL);

client.connect();
client.on('error', err => console.log(err));

// set view engine
app.set('view engine', 'ejs');

app.get('/', getBooksFromDb);
// api routes
// renders the search form
app.get('/new', newSearch);

// creases a new search to the google books api
app.post('/searches', createSearch);

app.get('/searches/:save_id', saveOneBook);

app.get('/details/:detail_id', viewDetails);
// catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.get('/test', (request, response) => response.status(200).send('this works jabroni'));

app.listen(PORT, () => console.log(`listening on port: ${PORT}`));

// Helper Functions
// Only show part of this to get students started

// note that .ejs file extension is not required
function newSearch(request, response) {
  response.render('pages/new');
}

// No API key required
// console.log request.body and request.body.search
function createSearch(request, response) {
  console.log(request.body)

  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if (request.body.search[1] === 'title') {
    url += `+intitle:${request.body.search[0]}`;
  }
  if (request.body.search[1] === 'author') {
    url += `+inauthor:${request.body.search[0]}`;
  }

  console.log(url);
  superagent.get(url)
    .then(apiResponse =>
      apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results =>
      response.render('pages/searches/show', { booksArray: results }))
    .catch(err => errorHandler(err, response))
}

function Book(banana) {
  this.title = banana.title || 'No title available';
  this.author = banana.authors || 'Author Unknown';
  this.description = banana.description || 'Description unavailable';
  this.image_url = banana.imageLinks.thumbnail || 'Image unavailable';
  const urlFixer = (url) => {
    if (url.match(/https/)) { return url }
    else { return url.replace(/http/, 'https') }
  }
  this.image_url = urlFixer(this.image_url);
  this.isbn = banana.industryIdentifiers[0].identifier.replace(/[^\d]/g,'') || 'ISBN unavailable';
}

const errorHandler = (err, response) => {
  console.log(err);
  if (response) response.status(500).render('pages/error');
}

function saveBookToDb(sqlInfo) {
  let params = [];

  for (let i = 1; i <= sqlInfo.values.length; i++) {
    params.push(`$${i}`);
  }
  let sqlParams = params.join();

  let sql = `INSERT INTO books (${sqlInfo.columns}) VALUES (${sqlParams});`

  try {return client.query(sql, sqlInfo.values);}
  catch (err) {errorHandler(err);}
}

function getBooksFromDb(request, response) {
  let sql = `SELECT * FROM BOOKS`;

  try { return client.query(sql)
    .then(results => {
      console.log('results.rows' , results.rows);
      // this needs to make a JS object
      response.render('pages/index', { booksArray: results.rows });
    }); }
  catch (err) {errorHandler(err);}
}

// function getOneBook(request, response) {

// }

function saveOneBook(request, response) {
  let isbn = request.params.save_id;
  let url = `https://www.googleapis.com/books/v1/volumes?q=+isbn${isbn}`;
  console.log(url);
  superagent.get(url)
    .then(isbnResult => {
      let saveBook = new Book(isbnResult.body.items[0].volumeInfo);
      let sqlInfo = {};
      sqlInfo.columns = Object.keys(saveBook).join();
      sqlInfo.values = Object.values(saveBook);

      console.log(sqlInfo.columns);
      console.log(sqlInfo.values);

      saveBookToDb(sqlInfo)
        .then(response.redirect('/'));
    })
}

function viewDetails(request, response) {
  let isbn = request.params.detail_id;
  let url = `https://www.googleapis.com/books/v1/volumes?q=+isbn${isbn}`;
  superagent.get(url)
    .then(isbnResult => {
      let bookDetail = new Book(isbnResult.body.items[0].volumeInfo);
      response.render('pages/detail', { booksArray: [bookDetail] });
    });
}

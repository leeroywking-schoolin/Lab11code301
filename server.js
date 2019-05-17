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
app.use(express.static('public/'));
const methodOverride = require('method-override');

app.use(methodOverride((request, response) => {
  if (request.body && typeof request.body === 'object' && '_method' in request.body) {
    // look in urlencoded POST bodies and delete it
    let method = request.body._method;
    delete request.body._method;
    return method;
  }
}))

const client = new pg.Client(process.env.DATABASE_URL);

client.connect();
client.on('error', err => console.log(err));

// set view engine
app.set('view engine', 'ejs');

app.get('/', getBooksFromDb);

app.get('/new', newSearch);
app.post('/searches', createSearch);
app.post('/searches/save_id', saveBook);
app.post('/searches/save_idput', updateBook);


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
  // console.log(request.body)

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
  this.isbn = banana.industryIdentifiers[0].identifier.replace(/[^\d]/g, '') || 'ISBN unavailable';
}

const errorHandler = (err, response) => {
  console.log(err);
  if (response) response.status(500).render('pages/error');
}

function getBooksFromDb(request, response) {
  let sql = `SELECT * FROM BOOKS`;

  try {
    return client.query(sql)
      .then(results => {
        // console.log('results.rows', results.rows);
        // this needs to make a JS object
        response.render('pages/index', { booksArray: results.rows });
      });
  }
  catch (err) { errorHandler(err); }
}

// function getOneBook(request, response) {

// }

function saveBook(request, response) {
  console.log('congrats you hit the save book function');
  // console.log(request.body.saveBook);

  // let {title, author, description, image_url, isbn, bookshelf} = request.body.saveBook;
  let title = request.body.saveBook[0]
  let author = request.body.saveBook[1]
  let description =request.body.saveBook[2].slice(0,750)
  let image_url = request.body.saveBook[3]
  let isbn = request.body.saveBook[4]
  let bookshelf = request.body.saveBook[5]

  let SQL = 'INSERT INTO books(title, author, description, image_url, isbn, bookshelf) VALUES($1,$2,$3,$4,$5,$6);';
  let values = [title, author, description, image_url, isbn, bookshelf];

  return client.query(SQL, values)
    .then(response.redirect(`/details/${isbn}`),)
    .then(err => errorHandler(err));
}

function updateBook(request, response) {
  console.log('UPDATING THE BOOK')
  // let {title, author, description, image_url, isbn, bookshelf} = request.body.saveBook;
  let title = request.body.saveBook[0]
  let author = request.body.saveBook[1]
  let description =request.body.saveBook[2].slice(0,750)
  let image_url = request.body.saveBook[3]
  let isbn = request.body.saveBook[4]
  let bookshelf = request.body.saveBook[5]

  let SQL = 'UPDATE books SET title=$1, author=$2 ,description=$3 , bookshelf=$5 WHERE isbn=$4';
  let values = [title, author, description, isbn, bookshelf];

  return client.query(SQL, values)
    .then(response.redirect('/'))
    .then(err => errorHandler(err));
}

function viewDetails(request, response) {
  console.log(' congrats you made it to the view details endpoint')
  let isbn = request.params.detail_id;
  let VALUES = [isbn];
  let SQL = `SELECT * FROM BOOKS where isbn=$1`;
  return client.query(SQL, VALUES)
      .then(results => {
        console.log('results.rows', results.rows);
        // this needs to make a JS object
        response.render('pages/detail', { booksArray: results.rows });
      })
  .catch(err => errorHandler(err))
}

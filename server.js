'use strict';

// dependancies
const express = require('express');
const superagent = require('superagent');
require('dotenv').config();

// App setup
const app = express();
const PORT = process.env.PORT;

// middle ware
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

// set view engine
app.set('view engine', 'ejs');

// api routes
// renders the search form
app.get('/', newSearch);

// creases a new search to the google books api
app.post('/searches', createSearch);

// catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.get('/test', (request, response) => response.status(200).send('this works jabroni'));

app.listen(PORT, () => console.log(`listening on port: ${PORT}`));

// Helper Functions
// Only show part of this to get students started


// note that .ejs file extension is not required
function newSearch(request, response) {
    response.render('pages/index');
}

// No API key required
// console.log request.body and request.body.search
function createSearch(request, response){
    console.log(request.body)
    
    let url = 'https://ww.googleapis.com/books/v1/volumes?q=';

    if (request.bodyu.search[1] === 'title') { 
        url += `+intitle:${request.body.search[0]}`;
    }
    if (request.body.search[1] === 'author') { 
        url +=`+inauthor:${request.body.search[0]}`;
    }

    console.log(url);
    response.send('OK');
    superagent.get(url)
    .then(apiResponse =>
        apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => 
        response.render('pages/searches/show', { searchResults: results }))
    .catch(err => errorHandler(err,response))
}

function Book(banana){
    this.title = banana.title || 'No title available';
    this.authorsArray = banana.authors || 'Author Unknown';
    this.description = banana.description || 'Description unavailable';
    this.imageURL = banana.imageLinks.thumbnail || 'Image unavailable';
    const urlFixer = (url) => {
        if(url.match(/https/)){return url}
        else{return url.replace(/http/, 'https')}
      }
    this.imageURL = urlFixer(this.imageURL);
};

const errorHandler = (err,response) => {
    console.log(err);
    if(response) response.status(500).send('Sorry muchacho, try again later');
}
'use strict';

// dependancies
const express = require('express');
const superagent = require('superagent');

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

app.listen(PORT, () => console.log(`listening on port: ${PORT}`));

// Helper Functions
// Only show part of this to get students started
function Book(info) {
    const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = info.title || 'No title available';
};

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
        apiResponse.body.items.map(
            bookResult => new Book(bookResult.volumeInfo)))
    .then(result => 
        response.render('pages/searches/show', { searchResults: results }));
    
}
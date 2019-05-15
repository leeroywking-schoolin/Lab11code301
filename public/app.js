'use strict';

$('.bookForm').hide();

$('.detailButton').click(() => {
  $('.booksDiv').hide();
  console.log(event.target.name);
  $(`#${event.target.name}`).show();
});

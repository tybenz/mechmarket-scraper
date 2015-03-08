var request = require( 'request' );
var jsdom = require( 'jsdom-no-contextify' );
var url = require( 'url' );
var fs = require( 'fs' );
var searchUrl = 'http://www.reddit.com/r/mechmarket/search?q=wts+granite&sort=new&restrict_sr=on&t=day';
var moment = require( 'moment' );
var time = fs.readFileSync( __dirname + '/tmp/time.txt', 'utf8' ).replace( /^\s*/, '' ).replace( /\s*$/, '' );
console.log( time );
if ( time ) {
  var latest = moment( time );
} else {
  var latest = { hour: -1 };
}
var now = moment();

jsdom.env(
  searchUrl,
  [],
  function( errors, window ) {
    if ( !window.document.querySelector( '#noresults' ) ) {
      console.log( 'FOUND' );
      if ( latest.hour != now.hour ) {
        console.log( 'NOTIFYING' );
        notify();
        logTime();
      } else {
        console.log( 'ALREADY NOTIFIED' );
      }
    } else {
      console.log( 'EMPTY' );
      clearTime();
    }
  }
);

var textBeltResponded = function( err, response ) {
  try {
    console.log( response.statusCode, JSON.parse( response.body ) );
  } catch( err ) {
    console.log( response.statusCode, response.body );
  }
};

var notify = function() {
  request({
    method: 'POST',
    url: 'http://textbelt.com/text',
    formData: {
      number: '2096142267',
      message: 'Someone one posted at: ' + searchUrl
    }
  }, textBeltResponded );
};

var logTime = function() {
  fs.writeFileSync( __dirname + '/tmp/time.txt', moment().format(), 'utf8' );
};

var clearTime = function() {
  fs.writeFileSync( __dirname + '/tmp/time.txt', '', 'utf8' );
};

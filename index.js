var request = require( 'request' );
var jsdom = require( 'jsdom-no-contextify' );
var url = require( 'url' );
var moment = require( 'moment' );
var searchUrl = 'http://www.reddit.com/r/mechmarket/search?q=wts+granite&sort=new&restrict_sr=on&t=day';
if (process.env.REDISTOGO_URL) {
  var rtg   = require( 'url' ).parse( process.env.REDISTOGO_URL );
  var redis = require( 'redis' ).createClient( rtg.port, rtg.hostname );

  redis.auth( rtg.auth.split( ':' )[ 1 ] );
} else {
  var redis = require( 'redis' ).createClient();
}
var latest;

redis.get( 'time', function( err, t ) {
  if ( err ) {
    console.log( err );
    return;
  }
  if ( t ) {
    latest = moment( t );
  } else {
    latest = { hour: -1 };
  }
  check();
});

var check = function() {
  var now = moment();

  jsdom.env(
    searchUrl,
    [],
    function( errors, window ) {
      if ( !window.document.querySelector( '#noresults' ) ) {
        console.log( 'FOUND' );
        if ( latest.hour != now.hour ) {
          console.log( 'NOTIFYING' );
          notify( logTime );
        } else {
          console.log( 'ALREADY NOTIFIED' );
          exit();
        }
      } else {
        console.log( 'EMPTY' );
        clearTime();
      }
    }
  );
};

var textBeltResponded = function( err, response ) {
  try {
    console.log( response.statusCode, JSON.parse( response.body ) );
  } catch( err ) {
    console.log( response.statusCode, response.body );
  }
};

var notify = function( fn ) {
  request({
    method: 'POST',
    url: 'http://textbelt.com/text',
    formData: {
      number: '2096142267',
      message: 'Someone one posted at: ' + searchUrl
    }
  }, function( err, response ) {
    textBeltResponded( err, response );
    fn();
  });
};

var logTime = function() {
  redis.set( 'time', moment().format(), exit );
};

var clearTime = function() {
  redis.set( 'time', '', exit );
};

var exit = function() {
  process.exit();
};

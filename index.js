var moment = require( 'moment' );
var now = moment().utcOffset( '-0700' );
if ( now.hour() < 7 || now.hour() > 22 ) {
  console.log( 'CANCELLED DUE TO TIME OF DAY' );
  console.log( now.format() );
  process.exit();
}
var request = require( 'request' );
var jsdom = require( 'jsdom-no-contextify' );
var url = require( 'url' );
var searchUrl = 'http://www.reddit.com/r/mechmarket/search?q=wts+granite&sort=new&restrict_sr=on&t=all';
if (process.env.REDISTOGO_URL) {
  var rtg   = require( 'url' ).parse( process.env.REDISTOGO_URL );
  var redis = require( 'redis' ).createClient( rtg.port, rtg.hostname );

  redis.auth( rtg.auth.split( ':' )[ 1 ] );
} else {
  var redis = require( 'redis' ).createClient();
}
var linkList;

redis.get( 'links', function( err, list ) {
  if ( err ) {
    console.log( err );
    return;
  }
  linkList = list ? JSON.parse( list ) : [];
  check();
});

var check = function() {
  var now = moment();

  jsdom.env(
    searchUrl,
    [],
    function( errors, window ) {
      var links = window.document.querySelectorAll( '.sitetable.linklisting .entry a.title' );
      var missing = false;
      console.log( 'BEFORE', linkList );
      linkList = Array.prototype.map.call( links, function( node ) {
        if ( linkList.indexOf( node.href ) == -1 ) {
          missing = true;
        }
        return node.href;
      });
      console.log( 'AFTER', linkList );

      if ( missing ) {
        console.log( 'NOTIFYING' );
        notify( updateList );
      } else {
        console.log( 'ALREADY NOTIFIED OR LIST EMPTY' );
        exit();
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

var updateList = function() {
  redis.set( 'links', JSON.stringify( linkList ), exit );
};

var exit = function() {
  process.exit();
};

var request = require( 'request' );
var jsdom = require( 'jsdom-no-contextify' );
var url = require( 'url' );
var moment = require( 'moment' );
var searchUrl = 'http://www.reddit.com/r/mechmarket/search?q=wts+title%3Agranite&sort=new&restrict_sr=on&t=all';
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
  linkList = linkList ? JSON.parse( linkList ) : [];
  check();
});

var check = function() {
  var now = moment();

  jsdom.env(
    searchUrl,
    [],
    function( errors, window ) {
      var links = window.document.querySelector( '.sitetable.linklisting .entry a.title' );
      console.log( links );
      var missing = false;
      console.log( linkList );
      linkList = Array.prototype.map.call( links, function( node ) {
        console.log( node.href );
        if ( linkList.indexOf( node.href ) == -1 ) {
          missing = true;
        }
        return node.href;
      });

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

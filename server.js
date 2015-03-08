var http = require( 'http' );

var server = http.createServer( function( request, response ) {
  response.writeHead( 200, { 'Content-Type': 'application/json' } );
  response.write( '{"message": "Hello"}' );
});

server.listen( process.env.PORT || 3000 );

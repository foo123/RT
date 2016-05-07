/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets
*  RT BOSH Client
*
*  @version: 0.1.0
*  https://github.com/foo123/RT
*
**/
!function( root, factory ) {
"use strict";
if ( 'object' === typeof exports )
    factory( require('./RT.js') );
else
    factory( root['RT'] );
}(this, function( RT ) {
"use strict";

var PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
    __super__ = RT.Client[PROTO], Util = RT.Util
;

function XHR( )
{
    return window.XMLHttpRequest
        // code for IE7+, Firefox, Chrome, Opera, Safari
        ? new XMLHttpRequest( )
        // code for IE6, IE5
        : new ActiveXObject('Microsoft.XMLHTTP') // or ActiveXObject('Msxml2.XMLHTTP'); ??
    ;
}
function ajax( xhr, url, headers, data, cb )
{
    if ( xhr )
    {
        try{ xhr.abort( ); }catch(e){ }
        xhr = null;
    }
    xhr = xhr || XHR( );
    xhr.open('POST', url, true);
    xhr.responseType = 'text';
    xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf8');
    xhr.overrideMimeType('text/plain; charset=utf8');
    if ( headers ) Util.Header.encode( headers, xhr );
    xhr.onload = function( ) {
        var err = 200 !== xhr.status,
            response = err ? xhr.statusText : xhr.responseText;
        if ( cb ) cb( err, response, xhr.getAllResponseHeaders( ), xhr.status, xhr.statusText );
    };
    xhr.send( data );
    return xhr;
}

RT.Client.BOSH = function Client_BOSH( config ) {
    var self = this;
    if ( !(self instanceof Client_BOSH) ) return new Client_BOSH(config);
    __super__.constructor.call( self, config );
    self._xhr = null;
};
RT.Client.Impl['bosh'] = RT.Client.BOSH;

/* extends RT.Client class */
RT.Client.BOSH[PROTO] = Object.create( __super__ );
RT.Client.BOSH[PROTO].constructor = RT.Client.BOSH;
RT.Client.BOSH[PROTO]._xhr = null;
RT.Client.BOSH[PROTO].dispose = function( ){
    var self = this;
    if ( self._xhr ) try{ self._xhr.abort( ); }catch(e){ }
    self._xhr = null;
    return __super__.dispose.call( self );
};

// export it
return RT;
});
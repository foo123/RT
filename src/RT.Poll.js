/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets
*  RT Poll Client
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

RT.Client.Poll = function Client_Poll( config ) {
    var self = this;
    if ( !(self instanceof Client_Poll) ) return new Client_Poll(config);
    __super__.constructor.call( self, config );
    self._interval = config.pollInterval || 500;
    self._timer = null;
    self._xhr = null;
    self._queue = [];
};
RT.Client.Impl['poll'] = RT.Client.Impl['ajax'] = RT.Client.Impl['xhr'] = RT.Client.Impl['ajax-poll'] = RT.Client.Impl['xhr-poll'] = RT.Client.Poll;

/* extends RT.Client class */
RT.Client.Poll[PROTO] = Object.create( __super__ );
RT.Client.Poll[PROTO].constructor = RT.Client.Poll;
RT.Client.Poll[PROTO]._interval = 500;
RT.Client.Poll[PROTO]._timer = null;
RT.Client.Poll[PROTO]._xhr = null;
RT.Client.Poll[PROTO].dispose = function( ){
    var self = this;
    if ( self._timer ) clearTimeout( self._timer );
    if ( self._xhr ) try{ self._xhr.abort( ); }catch(e){ }
    self._timer = null;
    self._xhr = null;
    self._interval = null;
    self._queue = null;
    return __super__.dispose.call( self );
};
RT.Client.Poll[PROTO]._poll = function poll( url ){
    var self = this;
    var headers = self._headers || {};
    headers['X-RT-POLL'] = 1;
    self._headers = { };
    self._xhr = ajax( self._xhr, url, headers, self._queue.shift( ), function( err, response, headers ){
        headers = Util.Header.decode( headers, true );
        var message_type = headers[ 'x-rt-type' ];
        if ( err ) self.trigger( 'error', response );
        else if ( !!response )
        {
            self.trigger( open ? 'open' : 'message', response );
        }
        self._timer = setTimeout(function( ){
            poll( url );
        }, self._interval);
    });
};
RT.Client.Poll[PROTO].send = function( data ){
    var self = this;
    self._queue.push( data );
    return self;
};
RT.Client.Poll[PROTO].listen = function( url ){
    var self = this;
    self._poll( url, true );
    return self;
};
RT.Client.Poll[PROTO].open = function( url ){
    var self = this;
    var headers = self._headers || {};
    headers['X-RT-POLL'] = 1;
    self._headers = { };
    self._xhr = ajax( self._xhr, url, headers, self._queue.shift( ), function( err, response, headers ){
        headers = Util.Header.decode( headers, true );
        var message_type = headers[ 'x-rt-type' ];
        if ( err ) self.trigger( 'error', response );
        else if ( !!response )
        {
            self.trigger( open ? 'open' : 'message', response );
        }
        self._timer = setTimeout(function( ){
            poll( url );
        }, self._interval);
    });
};
RT.Client.Poll[PROTO].close = function( ){
    var self = this;
    self._queue = [];
    return self;
};

// export it
return RT;
});
/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets
*  RT WebSocket Client (w/ websocket shim)
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
    __super__ = RT.Client[PROTO], Util = RT.Util,
    WebSocket = window.WebSocket || window.MozWebSocket
;

function load_websocket_shim( cb )
{
    var scripts = document.getElementsByTagName('scripts'), script_swfobject, script_websocket,
        base_url = scripts[scripts.length-1].src.split('/').slice(0,-1).join('/'),
        head = document.getElementsByTagName('head')[0];
    if ( !window.swfobject )
    {
        script_swfobject = document.createElement('script');
        script_swfobject.setAttribute('type', 'text/javascript');
        script_swfobject.setAttribute('language', 'javascript');
        script_swfobject.setAttribute('src', base_url+'/websocket/swfobject.js');
        head.appendChild( script_swfobject );
    }
    
    window.WEB_SOCKET_SWF_LOCATION = base_url+'/websocket/WebSocketMain.swf';
    window.WEB_SOCKET_FORCE_FLASH = false;
    window.WEB_SOCKET_DEBUG = false;
    
    script_websocket = document.createElement('script');
    script_websocket.setAttribute('type', 'text/javascript');
    script_websocket.setAttribute('language', 'javascript');
    script_websocket.setAttribute('src', base_url+'/websocket/web_socket.js');
    script_websocket.onload = script_websocket.onreadystatechange = function( ) {
        if ( 'loaded' == script_websocket.readyState  || 'complete' == script_websocket.readyState )
        {
            script_websocket.onload = script_websocket.onreadystatechange = null;
            if ( cb ) cb( );
        }
    };
    head.appendChild( script_websocket );
}

if ( !WebSocket ) load_websocket_shim(function( ){
    WebSocket = window.WebSocket;
});

RT.Client.WS = function Client_WS( config ) {
    var self = this;
    if ( !(self instanceof Client_WS) ) return new Client_WS(config);
    __super__.constructor.call( self, config );
    self._ws = null;
};
RT.Client.Impl['ws'] = RT.Client.Impl['websocket'] = RT.Client.Impl['web-socket'] = RT.Client.WS;

/* extends RT.Client class */
RT.Client.WS[PROTO] = Object.create( __super__ );
RT.Client.WS[PROTO].constructor = RT.Client.WS;
RT.Client.WS[PROTO]._ws = null;
RT.Client.WS[PROTO].dispose = function( ){
    var self = this;
    self._ws = null;
    return __super__.dispose.call( self );
};

// export it
return RT;
});
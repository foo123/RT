/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets for Node/JS
*  RT WebSocket Client (w/ websocket shim)
*
*  @version: 1.0.0
*  https://github.com/foo123/RT
*
**/
!function( root, factory ) {
"use strict";
if ( 'object' === typeof exports )
    factory( require('./RT.js') );
else
    factory( root['RT'] ) && ('function' === typeof define) && define.amd && define(function( ){ return root['RT']; });
}(this, function( RT ) {
"use strict";

var PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
    __super__ = RT.Client[PROTO], U = RT.Util,
    WebSocket = RT.Platform.Node ? require('ws') : (window.WebSocket || window.MozWebSocket || window.WebkitWebSocket)
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
        script_swfobject.setAttribute('src', base_url+'/lib/ws/swfobject.js');
        head.appendChild( script_swfobject );
    }
    
    window.WEB_SOCKET_SWF_LOCATION = base_url+'/lib/ws/WebSocketMain.swf';
    window.WEB_SOCKET_FORCE_FLASH = false;
    window.WEB_SOCKET_DEBUG = false;
    
    script_websocket = document.createElement('script');
    script_websocket.setAttribute('type', 'text/javascript');
    script_websocket.setAttribute('language', 'javascript');
    script_websocket.onload = script_websocket.onreadystatechange = function( ) {
        if ( 'loaded' == script_websocket.readyState  || 'complete' == script_websocket.readyState )
        {
            script_websocket.onload = script_websocket.onreadystatechange = null;
            if ( cb ) cb( );
        }
    };
    script_websocket.setAttribute('src', base_url+'/lib/ws/web_socket.js');
    head.appendChild( script_websocket );
}
if ( !RT.Platform.Node && !WebSocket ) load_websocket_shim(function( ){ WebSocket = window.WebSocket; });

RT.Client.WS = function Client_WS( config ) {
    var self = this;
    if ( !(self instanceof Client_WS) ) return new Client_WS(config);
    __super__.constructor.call( self, config );
    self.$ws$ = null;
};
RT.Client.Impl['ws'] = RT.Client.Impl['websocket'] = RT.Client.Impl['web-socket'] = RT.Client.WS;

/* extends RT.Client class */
RT.Client.WS[PROTO] = Object.create( __super__ );
RT.Client.WS[PROTO].constructor = RT.Client.WS;
RT.Client.WS[PROTO].$ws$ = null;
RT.Client.WS[PROTO].dispose = function( ){
    var self = this;
    self.$ws$ = null;
    return __super__.dispose.call( self );
};
RT.Client.WS[PROTO].abort = function( ){
    var self = this, ws = self.$ws$;
    if ( ws && (WebSocket.OPEN === ws.readyState) )
    {
        ws.close( );
        __super__.abort.call( self, true );
    }
    self.$ws$ = null;
    return self;
};
RT.Client.WS[PROTO].close = function( e ){
    var self = this, ws = self.$ws$;
    if ( ws && (WebSocket.OPEN === ws.readyState) ) ws.close( );
    __super__.close.call( self, e );
    return self;
};
RT.Client.WS[PROTO].send = function( payload ){
    var self = this, ws = self.$ws$;
    if ( ws && (WebSocket.OPEN === ws.readyState) ) ws.send( String(payload) );
    return self;
};
RT.Client.WS[PROTO].listen = function( ){
    var self = this, ws;
    if ( !WebSocket )
    {
        // wait until WebSocket is installed, if needed
        setTimeout(function( ){
            self.listen( );
        }, 100);
        return self;
    }
    ws = self.$ws$ = new WebSocket( self.$cfg$.endpoint );
    ws.addEventListener('open', function( e ) {
        self.open( e );
    });
    ws.addEventListener('close', function( e ) {
        self.close( e );
    });
    ws.addEventListener('error', function( e ) {
        self.emit( 'error', e );
    });
    ws.addEventListener('message', function( e ) {
        self.emit( 'receive', e.data );
    });
    return self;
};

// export it
return RT;
});
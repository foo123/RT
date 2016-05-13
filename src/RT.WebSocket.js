/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets for Node/XPCOM/JS
*  RT WebSocket Client (w/ websocket shim)
*
*  @version: 1.0.1
*  https://github.com/foo123/RT
*
**/
!function( root, factory ) {
"use strict";
if ( ('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import']) )
    factory( root['RT'] );
else if ( 'object' === typeof exports )
    factory( require('./RT.js') );
else
    factory( root['RT'] ) && ('function' === typeof define) && define.amd && define(function( ){ return root['RT']; });
}(this, function( RT ) {
"use strict";

var PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
    __super__ = RT.Client[PROTO], U = RT.Util,
    WebSocket = RT.Platform.XPCOM || RT.Platform.Node
    ? null
    : (window.WebSocket || window.MozWebSocket || window.WebkitWebSocket)
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
    script_websocket.setAttribute('src', base_url+'/lib/ws/ws.js');
    head.appendChild( script_websocket );
}

if ( RT.Platform.XPCOM )
{
    var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils, Cr = Components.results;
    Cu['import']('resource://gre/modules/Services.jsm');
    //Cu['import']('resource://gre/modules/XPCOMUtils.jsm');

    // WebSocket implementation as XPCOM component
    WebSocket = function( url, protocols/*, proxyHost, proxyPort, headers*/ ) {
        var self = this;
        protocols = 
        self._e = { };
        self.readyState = WebSocket.CONNECTING;
        self._ws = Cc["@mozilla.org/network/protocol;1?name=wss"].createInstance( Ci.nsIWebSocketChannel );
        self._ws.initLoadInfo(
            null, // aLoadingNode
            Services.scriptSecurityManager.getSystemPrincipal( ),
            null, // aTriggeringPrincipal
            Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_DATA_IS_NULL,
            Ci.nsIContentPolicy.TYPE_WEBSOCKET
        );
        if ( 'string' === typeof protocols ) protocols = [protocols];
        if ( protocols ) self._ws.protocol = protocols.join('; ');
        self._ws.asyncOpen( Services.io.newURI( url, null, null ), null, 0, self, null );
    };

    WebSocket.CONNECTING = 0;
    WebSocket.OPEN = 1;
    WebSocket.CLOSING = 2;
    WebSocket.CLOSED = 3;

    WebSocket.prototype = {
        constructor: WebSocket
        ,readyState: 0
        ,_ws: null
        ,_e: null
        ,addEventListener: function( event, handler ) {
            this._e[event] = handler;
        }
        ,removeEventListener: function( event, handler ) {
            if ( this._e[event] && (null == handler || handler === this._e[event]) ) delete this._e[event];
        }
        ,dispatchEvent: function( event, data ) {
            if ( this._e[event] )
                this._e[event]( {event:event, data:data, target:this} );
        }
        
        /**
        * nsIWebSocketListener method, handles the start of the websocket stream.
        *
        * @param {nsISupports} aContext Not used
        */
        ,onStart: function( ) {
            var self = this;
            if( WebSocket.CONNECTING === self.readyState )
            {
                self.readyState = WebSocket.OPEN;
                self.dispatchEvent( 'open' );
            }
        }

        /**
        * nsIWebSocketListener method, called when the websocket is closed locally.
        *
        * @param {nsISupports} aContext Not used
        * @param {nsresult} aStatusCode
        */
        ,onStop: function( aContext, aStatusCode ) {
            var self = this;
            if( WebSocket.CLOSING === self.readyState || WebSocket.OPEN === self.readyState )
            {
                self.readyState = WebSocket.CLOSED;
                self.dispatchEvent( Cr.NS_OK === aStatusCode || self._ws.CLOSE_NORMAL === aStatusCode ? 'close' : 'error', {status:aStatusCode} );
            }
        }

        /**
        * nsIWebSocketListener method, called when the websocket is closed
        * by the far end.
        *
        * @param {nsISupports} aContext Not used
        * @param {integer} aCode the websocket closing handshake close code
        * @param {String} aReason the websocket closing handshake close reason
        */
        ,onServerClose: function( aContext, aCode, aReason ) {
            var self = this;
            if( WebSocket.OPEN === self.readyState )
            {
                self.readyState = WebSocket.CLOSED;
                self.dispatchEvent( 'close', {status:aCode, statusTxt:aReason} );
            }
        }

        /**
        * nsIWebSocketListener method, called when the websocket receives
        * a text message (normally json encoded).
        *
        * @param {nsISupports} aContext Not used
        * @param {String} aMsg The message data
        */
        ,onMessageAvailable: function( aContext, aMsg ) {
            var self = this;
            if( WebSocket.OPEN === self.readyState )
            {
                self.dispatchEvent( 'message', aMsg );
            }
        }

        /**
        * nsIWebSocketListener method, called when the websocket receives a binary message.
        * This class assumes that it is connected to a SimplePushServer and therefore treats
        * the message payload as json encoded.
        *
        * @param {nsISupports} aContext Not used
        * @param {String} aMsg The message data
        */
        ,onBinaryMessageAvailable: function( aContext, aMsg ) {
            var self = this;
            if( WebSocket.OPEN === self.readyState )
            {
                self.dispatchEvent( 'message', aMsg );
            }
        }

        /**
        * Create a JSON encoded message payload and send via websocket.
        *
        * @param {Object} aMsg Message to send.
        *
        * @returns {Boolean} true if message has been sent, false otherwise
        */
        ,send: function( aMsg ) {
            var self = this;
            if( WebSocket.OPEN === self.readyState )
            {
                try {
                    self._ws.sendMsg( aMsg );
                }
                catch (e) {
                    return false;
                }
                return true;
            }
            return false;
        }

        /**
        * Close the websocket.
        */
        ,close: function( ) {
            var self = this;
            if( WebSocket.CLOSING === self.readyState || WebSocket.CLOSED === self.readyState )
            {
                return;
            }
            self.readyState = WebSocket.CLOSING;
            try {
                self._ws.close( self._ws.CLOSE_NORMAL );
                self.readyState = WebSocket.CLOSED;
            }
            catch (e) {
                // Do nothing
                self.readyState = WebSocket.CLOSED;
            }
        }
    };
}
else if ( RT.Platform.Node )
{
    // NOTE: requires node-ws dependency
    WebSocket = require('ws');
}
else if ( !WebSocket )
{
    // load WebSocket Flash shim
    load_websocket_shim(function( ){ WebSocket = window.WebSocket; });
}

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
    if ( !WebSocket && !RT.Platform.XPCOM && !RT.Platform.Node )
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
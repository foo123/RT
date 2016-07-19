/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets / webrtc for Node/XPCOM/JS
*  RT WebSocket Client (w/ websocket shim)
*
*  @version: 1.0.1
*  https://github.com/foo123/RT
*
**/
!function( root, factory ){
"use strict";
if ( ('object'===typeof module) && module.exports ) /* CommonJS */
    module.exports = factory.call(root,(module.$deps && module.$deps["RT"]) || require("./RT"));
else if ( ("function"===typeof define) && define.amd && ("function"===typeof require) && ("function"===typeof require.specified) && require.specified("RT_WebSocket") /*&& !require.defined("RT_WebSocket")*/ ) 
    define("RT_WebSocket",['module',"RT"],function(mod,module){factory.moduleUri = mod.uri; factory.call(root,module); return module;});
else /* Browser/WebWorker/.. */
    (factory.call(root,root["RT"])||1)&&('function'===typeof define)&&define.amd&&define(function(){return root["RT"];} );
}(this, function ModuleFactory__RT_WebSocket( RT ){
"use strict";

var root = this, PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
    RT_Client = RT.Client, __super__ = RT_Client[PROTO], WebSocket
;

function load( path, ws_impl, cb )
{
    var scripts = document.getElementsByTagName('script'),
        this_script = scripts[scripts.length-1],
        base = this_script.src.split('/').slice(0,-1).join('/'),
        script_swf, script_ws,
        head = document.getElementsByTagName('head')[0];
    
    path = path || './';
    if ( '.' === path.charAt(0) )
    {
        path = path.slice( 1 );
        path = base + ('/' == path.charAt(0) ? '' : '/') + path;
    }
    if ( '/' !== path.charAt(path.length-1) )
    {
        path += '/';
    }
    
    if ( !window.swfobject )
    {
        script_swf = document.createElement('script');
        script_swf.setAttribute('type', 'text/javascript');
        script_swf.setAttribute('language', 'javascript');
        script_swf.setAttribute('src', this_script.hasAttribute('data-swfobject') ? this_script.getAttribute('data-swfobject') : (path+'swfobject.js'));
        head.appendChild( script_swf );
    }
    
    window.WEB_SOCKET_SWF_LOCATION = path+'WebSocketMain.swf';
    window.WEB_SOCKET_FORCE_FLASH = false;
    window.WEB_SOCKET_DEBUG = false;
    
    script_ws = document.createElement('script');
    script_ws.setAttribute('type', 'text/javascript');
    script_ws.setAttribute('language', 'javascript');
    script_ws.onload = script_ws.onreadystatechange = function( ) {
        if ( 'loaded' == script_ws.readyState  || 'complete' == script_ws.readyState )
        {
            script_ws.onload = script_ws.onreadystatechange = null;
            if ( cb ) cb( );
        }
    };
    script_ws.setAttribute('src', path+ws_impl);
    head.appendChild( script_ws );
}

if ( RT.Platform.XPCOM )
{
    Components.utils['import']('resource://gre/modules/XPCOMUtils.jsm');
    XPCOMUtils.importRelative(root, 'lib/ws/ws.xpcom.js');
    WebSocket = root['WebSocket'];
}
else if ( RT.Platform.Node )
{
    WebSocket = require('./lib/ws/ws.node.js');
}
else
{
    WebSocket = window.WebSocket || window.MozWebSocket || window.WebkitWebSocket;
    // load WebSocket Flash shim
    if ( !WebSocket && !RT.Platform.WebWorker ) load('./lib/ws/', 'ws.flash.js', function( ){ WebSocket = window.WebSocket; });
}

var Client_WS = RT_Client.WS = function Client_WS( cfg ) {
    var self = this;
    if ( !(self instanceof Client_WS) ) return new Client_WS(cfg);
    __super__.constructor.call( self, cfg );
    self.$ws$ = null;
};
RT_Client.Impl['ws'] = RT_Client.Impl['websocket'] = RT_Client.Impl['web-socket'] = Client_WS;

/* extends RT.Client class */
Client_WS[PROTO] = Object.create( __super__ );
Client_WS[PROTO].constructor = Client_WS;
Client_WS[PROTO].$ws$ = null;
Client_WS[PROTO].dispose = function( ){
    var self = this;
    self.$ws$ = null;
    return __super__.dispose.call( self );
};
Client_WS[PROTO].abort = function( ){
    var self = this, ws = self.$ws$;
    if ( ws && (WebSocket.OPEN === ws.readyState) )
    {
        ws.close( );
        __super__.abort.call( self, true );
    }
    self.$ws$ = null;
    return self;
};
Client_WS[PROTO].close = function( e ){
    var self = this, ws = self.$ws$;
    if ( ws && (WebSocket.OPEN === ws.readyState) ) ws.close( );
    __super__.close.call( self, e );
    return self;
};
Client_WS[PROTO].send = function( payload ){
    var self = this, ws = self.$ws$;
    if ( ws && (WebSocket.OPEN === ws.readyState) ) ws.send( String(payload) );
    return self;
};
Client_WS[PROTO].listen = function( ){
    var self = this, ws;
    if ( !WebSocket && !RT.Platform.XPCOM && !RT.Platform.Node )
    {
        // wait until WebSocket is available, if needed
        setTimeout(function( ){
            self.listen( );
        }, 100);
        return self;
    }
    ws = self.$ws$ = new WebSocket( self.$cfg$.endpoint, self.$cfg$.protocol||null );
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
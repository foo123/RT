/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets
*
*  @version: 0.1.0
*  https://github.com/foo123/RT
*
**/
!function( root, name, factory ) {
"use strict";
if ( 'object' === typeof exports )
    module.exports = factory( );
else
    (root[name] = factory( )) && ('function' === typeof define) && define.amd && define(function( req ) { return root[name]; });
}(this, 'RT', function( ) {
"use strict";

var PROTO = 'prototype', HAS = 'hasOwnProperty',
   KEYS = Object.keys, toString = Object[PROTO].toString,
   trim = String[PROTO].trim 
        ? function( s ) { return s.trim( ); }
        : function( s ) { return s.replace(/^\s+|\s+$/g, ''); }
;

function RT( config )
{
    config = config || { };
    var type = (config.type || 'default').toLowerCase( );
    return RT.Client.Impl[HAS](type) ? new RT.Client.Impl[type]( config ) : new RT.Client( config );
}
RT.VERSION = '0.1.0';

RT.Const = {
    CRLF: "\r\n",
    CRLF_RE: /(\r\n)|\r|\n/g,
    COOKIE_RE: /([^=]+)(?:=(.*))?/
};

RT.Util = {
    String: {
      trim: trim  
    },
    
    Base64: {
        encode: btoa,
        decode: atob
    },
    
    Json: {
        encode: JSON.stringify,
        decode: JSON.parse
    },
    
    Url: {
        create: function( o ) {
            if ( !o ) return '';
            var urlString = [], queue, keys = KEYS(o), key, val, k, kl = keys.length, entry, i, l, kk,
                encode = RT.Util.Url.encode, to_string;
            k = 0; queue = k < kl ? [ [key=keys[k++], o[key]] ] : [];
            while( queue.length )
            {
                entry = queue.shift( );
                key = entry[0]; val = entry[1];
                to_string = toString.call(val);
                if ( '[object Array]' === to_string )
                {
                    key += '[]';
                    for(i=0,l=val.length; i<l; i++)
                        queue.unshift( [ key, val[i] ] );
                }
                else if ( '[object Object]' === to_string )
                {
                    kk = KEYS(val);
                    for(i=0,l=kk.length; i<l; i++)
                        queue.unshift( [ key+'['+kk[i]+']', val[kk[i]] ] );
                }
                else
                {
                    urlString.push( encode(key) + '=' + encode(val) );
                }
                if ( !queue.length && k < kl ) queue.unshift( [ key=keys[k++], o[key] ] );
            }
            return urlString.join('&');
        },
        rawencode: function( s ) {
            return encodeURIComponent( ''+s )
                .split('!').join('%21')
                .split("'").join('%27')
                .split('(').join('%28')
                .split(')').join('%29')
                .split('*').join('%2A')
                //.split('~').join('%7E')
            ;        
        },
        rawdecode: function( s ){
            return decodeURIComponent( ''+s );
        },
        encode: function( s ) {
            return RT.Util.Url.rawencode( s ).split('%20').join('+');
        },
        decode: function( s ) { 
            return RT.Util.Url.rawdecode( ('' + s).split('+').join('%20') ); 
        }
    },
    
    Cookie: {
        create: function( name, value, domain, path, expires, secure, httponly ) {
            var argslen = arguments.length;
            return {
                 name     : argslen > 0 ? name : ''
                ,value    : argslen > 1 ? value : ''
                ,domain   : argslen > 2 ? domain : ''
                ,path     : argslen > 3 ? path : '/'
                ,expires  : argslen > 4 ? expires : new Date(Date.now() + 31536000000)
                ,secure   : argslen > 5 ? !!secure : false
                ,httponly : argslen > 6 ? !!httponly : false
            };
        },
        encode: function( cookie ) {
            if ( !cookie || !cookie.name ) return;
            var cookieString = String(cookie.name) + '=' + String(cookie.value);
            cookieString += '; Domain=' + String(cookie.domain);
            cookieString += '; Path=' + String(cookie.path);
            cookieString += '; Expires=' + String(cookie.expires);
            if ( cookie.secure ) cookieString += '; Secure';
            if ( cookie.httponly ) cookieString += '; HttpOnly';
            return cookieString;
        },
        decode: function( cookieString ) {
            var cookie = RT.Util.Cookie.create( ),
                /*  parse value/name  */
                equalsSplit = RT.Const.COOKIE_RE,
                cookieParams = ("" + cookieString).split("; "),
                cookieParam, attr, i, len
            ;
            if ( null == (cookieParam = cookieParams.shift().match(equalsSplit)) ) return;
            
            cookie.name  = cookieParam[1];
            cookie.value = cookieParam[2];

            /*  parse remaining attributes  */
            for (i=0,len=cookieParams.length; i<len; i++)
            {
                cookieParam = cookieParams[i].match(equalsSplit);
                if ( null != cookieParam && cookieParam.length)
                {
                    attr = cookieParam[1].toLowerCase();
                    if ( 'undefined' !== typeof cookie[attr] )
                        cookie[attr] = 'string' === typeof cookieParam[2] ? cookieParam[2] : true;
                }
            }
            /*  special post-processing for expire date  */
            if ( 'string' === typeof cookie.expires ) cookie.expires = new Date( cookie.expires );
            return cookie;
        }
    },
    
    Header: {
        encode: function( headers, xhr ) {
            var header = '';
            if ( !headers ) return xhr ? xhr : header;
            var keys = KEYS(headers), key, i, l, k, kl, CRLF = RT.Const.CRLF;
            if ( xhr )
            {
                for(i=0,l=keys.length; i<l; i++)
                {
                    key = keys[i];
                    if ( '[object Array]' === toString.call(headers[key]) )
                    {
                        for(k=0,kl=headers[key].length; k<kl; k++)
                            xhr.setRequestHeader(key, headers[key][k]);
                    }
                    else
                    {
                        xhr.setRequestHeader(key, headers[key]);
                    }
                }
                return xhr;
            }
            else
            {
                for(i=0,l=keys.length; i<l; i++)
                {
                    key = keys[i];
                    if ( '[object Array]' === toString.call(headers[key]) )
                    {
                        for(k=0,kl=headers[key].length; k<kl; k++)
                            header += CRLF + String(headers[key][k]);
                    }
                    else
                    {
                        header += CRLF + String(headers[key]);
                    }
                }
                return header;
            }
        },
        decode: function( headers, lowercase ) {
            var header = { }, key = null, parts, i, l, line, CRLF = RT.Const.CRLF;
            if ( !!headers )
            {
                lowercase = true === lowercase;
                headers = headers.split( CRLF );
                for (i=0,l=headers.length; i<l; i++)
                {
                    line = headers[i];
                    parts = line.split(':');
                    if ( parts.length > 1 )
                    {
                        key = trim(parts.shift());
                        if ( lowercase ) key = key.toLowerCase();
                        header[key] = parts.join(':');
                    }
                    else if ( key )
                    {
                        header[key] += CRLF + parts[0];
                    }
                }
            }
            return header;
        }
    }
};

RT.Client = function Client( config ) {
    var self = this;
    if ( !(self instanceof Client) ) return new Client( config );
    self._config = config;
    self._event = { };
    self.status = RT.Client.CREATED;
};

RT.Client.Impl = { };

RT.Client.OPENED = 2;
RT.Client.CLOSED = 4;
RT.Client.PENDING = 8;
RT.Client.CREATED = 1;
RT.Client.DESTROYED = 0;

RT.Client[PROTO] = {
     constructor: RT.Client
    ,status: RT.Client.CREATED
    ,_config: null
    ,_event: null
    ,dispose: function( ){
        var self = this;
        self.status = RT.Client.DESTROYED;
        self._config = null;
        self._event = null;
        return self;
    }
    ,addEventListener: function( event, handler ){
        var self = this;
        if ( !event || !handler ) return self;
        if ( !self._event[HAS](event) ) self._event[event] = [handler];
        else self._event[event].push(handler);
        return self;
    }
    ,removeEventListener: function( event, handler ){
        var self = this;
        if ( !event || !self._event[HAS](event) ) return self;
        if ( null == handler )
        {
            delete self._event[event];
        }
        else
        {
            for(var handle=self._event[event],i=handle.length-1; i>=0; i--)
                if ( handle[i] === handler ) handler.splice(i, 1);
            if ( !handle.length ) delete self._event[event];
        }
        return self;
    }
    ,trigger: function( event, data ){
        var self = this;
        if ( !event || !self._event[HAS](event) ) return self;
        var handler = self._event[event].slice( ), i, l = handler.length;
        for(i=0; i<l; i++) handler[i]( data );
        return self;
    }
    ,open: function( ){ }
    ,close: function( ){ }
    ,send: function( ){ }
    ,listen: function( ){ }
};
// aliases
RT.Client[PROTO].on = RT.Client[PROTO].addEventListener;
RT.Client[PROTO].off = RT.Client[PROTO].removeEventListener;

// export it
return RT;
});

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
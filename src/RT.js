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
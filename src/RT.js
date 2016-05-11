/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets for Node/JS
*
*  @version: 1.0.0
*  https://github.com/foo123/RT
*
**/
!function( root, name, factory ) {
"use strict";
if ( 'object' === typeof exports )
    module.exports = factory( );
else
    (root[name] = factory( )) && ('function' === typeof define) && define.amd && define(function( ){ return root[name]; });
}(this, 'RT', function( ) {
"use strict";

var PROTO = 'prototype', HAS = 'hasOwnProperty',
    KEYS = Object.keys, toString = Object[PROTO].toString,
    isNode = ('undefined' !== typeof global) && ('[object global]' === toString.call(global)),
    CC = String.fromCharCode,
    trim_re = /^\s+|\s+$/g,
    trim = String[PROTO].trim 
        ? function( s ) { return s.trim( ); }
        : function( s ) { return s.replace(trim_re, ''); },
    a2b_re = /[^A-Za-z0-9\+\/\=]/g, hex_re = /\x0d\x0a/g,
    UUID = 0
;

function RT( cfg )
{
    cfg = cfg || { };
    var type = (cfg.use || cfg.rt_type || 'default').toLowerCase( );
    return RT.Client.Impl[HAS](type) ? new RT.Client.Impl[type]( cfg ) : new RT.Client( cfg );
}

RT.VERSION = '1.0.0';

RT.Platform = {
    Node: isNode
};

RT.XHR = function XHR( send, abort ){
    var xhr = this, aborted = false;
    xhr.readyState = XHR.UNSENT;
    xhr.status = null;
    xhr.statusText = null;
    xhr.responseType = 'text';
    xhr.responseURL = null;
    xhr.response = null;
    xhr.responseText = null;
    xhr.responseXml = null;
    xhr._rawHeaders = null;
    xhr._headers = null;
    xhr.send = function( payload ) {
        if ( aborted || (XHR.UNSENT !== xhr.readyState) ) return xhr;
        if ( send ) send( payload );
        xhr.readyState = XHR.OPENED;
        return xhr;
    };
    xhr.abort = function( ){
        if ( aborted ) return;
        aborted = true;
        if ( abort ) abort( );
        return xhr;
    };
    xhr.getAllResponseHeaders = function( decoded ) {
        if ( XHR.DONE !== xhr.readyState ) return null;
        return true===decoded ? xhr._headers : xhr._rawHeaders;
    };
    xhr.getResponseHeader = function( key ) {
        if ( (null == key) || (XHR.DONE !== xhr.readyState) ) return null;
        var headers = xhr._headers || {};
        return headers[HAS](key) ? headers[key] : null;
    };
    xhr.dispose = function( ) {
        xhr.readyState = null;
        xhr.status = null;
        xhr.statusText = null;
        xhr.responseType = null;
        xhr.responseURL = null;
        xhr.response = null;
        xhr.responseText = null;
        xhr.responseXml = null;
        xhr._rawHeaders = null;
        xhr._headers = null;
        //xhr.send = null;
        //xhr.abort = null;
        return xhr;
    };
};
RT.XHR.UNSENT = 0;
RT.XHR.OPENED = 1;
RT.XHR.HEADERS_RECEIVED = 2;
RT.XHR.LOADING = 3;
RT.XHR.DONE = 4;
RT.XHR.create = isNode
    ? function( o, payload ) {
        o = o || {};
        if ( !o.url ) return null;
        var url = '[object Object]' === toString.call(o.url) ? o.url : require('url').parse( o.url ),
            $hr$, xhr,
            options = {
                method      : o.method || 'GET',
                agent       : false,
                protocol    : url.protocol,
                host        : url.hostname,
                hostname    : url.hostname,
                port        : url.port || 80,
                path        : (url.pathname||'/')+(url.query?('?'+url.query):'')
            }
        ;
        
        xhr = new RT.XHR(
        function( payload ) {
            if ( null != payload )
            {
                payload = String( payload );
                $hr$.setHeader( 'Content-Length', payload.length.toString() );
                $hr$.write( payload );
            }
            $hr$.end( );
        },
        function( ) {
            $hr$.abort( );
        });
        
        $hr$ = ('https:'===options.protocol?require('https').request:require('http').request)(options, function( response ) {
            var xdata = '', data_sent = 0;
            
            xhr.readyState = RT.XHR.OPENED;
            if ( o.onStateChange ) o.onStateChange( xhr );
            
            xhr.readyState = RT.XHR.HEADERS_RECEIVED;
            xhr._rawHeaders = response.rawHeaders.join("\r\n");
            xhr._headers = response.headers;
            xhr.responseURL = response.url || null;
            xhr.status = response.statusCode || null;
            xhr.statusText = response.statusMessage || null;
            if ( o.onStateChange ) o.onStateChange( xhr );
            
            response.on('data', function( chunk ){
                xdata += chunk.toString( );
                if ( !data_sent )
                {
                    data_sent = 1;
                    xhr.readyState = RT.XHR.LOADING;
                    if ( o.onStateChange ) o.onStateChange( xhr );
                    if ( o.onLoadStart ) o.onLoadStart( xhr );
                }
                if ( o.onProgress ) o.onProgress( xhr );
            });
            
            response.on('end', function( ){
                xhr.readyState = RT.XHR.DONE;
                xhr.responseType = 'text';
                xhr.response = xhr.responseText = xdata;
                
                if ( o.onStateChange ) o.onStateChange( xhr );
                if ( o.onLoadEnd ) o.onLoadEnd( xhr );
                
                if ( (RT.XHR.DONE === xhr.readyState) )
                {
                    if ( 200 === xhr.status )
                    {
                        if ( o.onComplete ) o.onComplete( xhr );
                    }
                    else
                    {
                        if ( o.onRequestError ) o.onRequestError( xhr );
                        else if ( o.onError ) o.onError( xhr );
                    }
                }
            });
            
            response.on('error', function( ee ){
                xhr.statusText = ee.toString( );
                if ( o.onError ) o.onError( xhr );
            });
        });
        
        $hr$.setTimeout(o.timeout || 30000, function( e ){
            if ( o.onTimeout ) o.onTimeout( xhr );
        });
        $hr$.on('abort', function( ee ){
            if ( o.onAbort ) o.onAbort( xhr );
        });
        $hr$.on('error', function( ee ){
            xhr.statusText = ee.toString( );
            if ( o.onError ) o.onError( xhr );
        });
        
        if ( o.headers ) RT.Util.Header.encode( o.headers, null, $hr$ );
        //if ( o.mimeType ) $hr$.overrideMimeType( o.mimeType );
        if ( arguments.length > 1 ) xhr.send( payload );
        return xhr;
    }
    : function( o, payload ) {
        o = o || {};
        if ( !o.url ) return null;
        var $xhr$ = window.XMLHttpRequest
            ? new XMLHttpRequest( )
            : new ActiveXObject( 'Microsoft.XMLHTTP' ) /* or ActiveXObject( 'Msxml2.XMLHTTP' ); ??*/,
            
            xhr = new RT.XHR(
            function( payload ){
                $xhr$.send( payload );
            },
            function( ){
                $xhr$.abort( );
            }),
            
            update = function( xhr, $xhr$ ) {
                xhr.readyState = $xhr$.readyState;
                xhr.responseType = $xhr$.responseType;
                xhr.responseURL = $xhr$.responseURL;
                xhr.response = $xhr$.response;
                xhr.responseText = $xhr$.responseText;
                xhr.responseXml = $xhr$.responseXml;
                xhr.status = $xhr$.status;
                xhr.statusText = $xhr$.statusText;
                return xhr;
            }
        ;
        xhr.getAllResponseHeaders = function( decoded ){
            var headers = $xhr$.getAllResponseHeaders( );
            return true===decoded ? RT.Util.Header.decode( headers ) : headers;
        };
        xhr.getResponseHeader = function( key ){
            return $xhr$.getResponseHeader( key );
        };
        
        $xhr$.open( o.method||'GET', o.url, !o.sync );
        xhr.responseType = $xhr$.responseType = o.responseType || 'text';
        $xhr$.timeout = o.timeout || 30000; // 30 secs default timeout
        
        if ( o.onProgress )
        {
            $xhr$.onprogress = function( ) {
                update( xhr, $xhr$ );
                o.onProgress( xhr );
            };
        }
        if ( o.onLoadStart )
        {
            $xhr$.onloadstart = function( ) {
                o.onLoadStart( update( xhr, $xhr$ ) );
            };
        }
        if ( o.onLoadEnd )
        {
            $xhr$.onloadend = function( ) {
                o.onLoadEnd( update( xhr, $xhr$ ) );
            };
        }
        if ( !o.sync && o.onStateChange )
        {
            $xhr$.onreadystatechange = function( ) {
                o.onStateChange( update( xhr, $xhr$ ) );
            };
        }
        $xhr$.onload = function( ) {
            update( xhr, $xhr$ );
            if ( (RT.XHR.DONE === $xhr$.readyState) )
            {
                if ( 200 === $xhr$.status )
                {
                    if ( o.onComplete ) o.onComplete( xhr );
                }
                else
                {
                    if ( o.onRequestError ) o.onRequestError( xhr );
                    else if ( o.onError ) o.onError( xhr );
                }
            }
        };
        $xhr$.onabort = function( ) {
            if ( o.onAbort ) o.onAbort( update( xhr, $xhr$ ) );
        };
        $xhr$.onerror = function( ) {
            if ( o.onError ) o.onError( update( xhr, $xhr$ ) );
        };
        $xhr$.ontimeout = function( ) {
            if ( o.onTimeout ) o.onTimeout( update( xhr, $xhr$ ) );
        };
        
        if ( o.headers ) RT.Util.Header.encode( o.headers, $xhr$ );
        if ( o.mimeType ) $xhr$.overrideMimeType( o.mimeType );
        if ( arguments.length > 1 ) xhr.send( payload );
        return xhr;
    }
;

RT.UUID = function( PREFIX, SUFFIX ) {
    return (PREFIX||'') + (++UUID) + '_' + (Date.now()) + '_' + Math.floor((1000*Math.random())) + (SUFFIX||'');
};

RT.Const = {
    BASE64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    CRLF: "\r\n",
    CRLF_RE: /(\r\n)|\r|\n/g,
    COOKIE_RE: /([^=]+)(?:=(.*))?/
};

RT.Util = {
    String: {
      trim: trim  
    },
    
    // adapted from jquery.base64
    Utf8: {
        encode: function( string ) {
            string = string.replace(hex_re, "\x0a");
            var output = '', n, l, c;
            for (n=0,l=string.length; n<l; n++)
            {
                c = string.charCodeAt(n);
                if ( c < 128 )
                    output += CC(c);
                else if ( (c > 127) && (c < 2048) )
                    output += CC((c >> 6) | 192) + CC((c & 63) | 128);
                else
                    output += CC((c >> 12) | 224) + CC(((c >> 6) & 63) | 128) + CC((c & 63) | 128);
            }
            return output;
        },
        decode: function( input ) {
            var string = '', i = 0, c = c1 = c2 = 0, l = input.length;
            while (i < l)
            {
                c = input.charCodeAt(i);
                if ( c < 128 )
                {
                    string += CC(c);
                    i++;
                }
                else if ( (c > 191) && (c < 224) )
                {
                    c2 = input.charCodeAt(i+1);
                    string += CC(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else
                {
                    c2 = input.charCodeAt(i+1);
                    c3 = input.charCodeAt(i+2);
                    string += CC(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }
    },
    
    // adapted from jquery.base64
    Base64: {
        encode: function( input ) {
            input = RT.Util.Utf8.encode( input );
            var output = '', chr1, chr2, chr3,
                enc1, enc2, enc3, enc4, i = 0, l = input.length,
                keyString = RT.Const.BASE64;
            while ( i < l )
            {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if ( isNaN(chr2) )
                {
                    enc3 = enc4 = 64;
                }
                else if ( isNaN(chr3) )
                {
                    enc4 = 64;
                }
                output = output + keyString.charAt(enc1) + keyString.charAt(enc2) + keyString.charAt(enc3) + keyString.charAt(enc4);
            }
            return output;
        },
        decode: function( input ) {
            input = input.replace(a2b_re, '');
            var output = '', chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0, l = input.length;
            while ( i < l )
            {
                enc1 = keyString.indexOf(input.charAt(i++));
                enc2 = keyString.indexOf(input.charAt(i++));
                enc3 = keyString.indexOf(input.charAt(i++));
                enc4 = keyString.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + CC(chr1);
                if ( 64 != enc3 )
                {
                    output += CC(chr2);
                }
                if ( 64 != enc4 )
                {
                    output += CC(chr3);
                }
            }
            output = RT.Util.Utf8.decode( output );
            return output;
        }
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
                cookieParams = String(cookieString).split('; '),
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
                    if ( cookie[HAS](attr) )
                        cookie[attr] = 'string' === typeof cookieParam[2] ? cookieParam[2] : true;
                }
            }
            /*  special post-processing for expire date  */
            if ( 'string' === typeof cookie.expires ) cookie.expires = new Date( cookie.expires );
            return cookie;
        }
    },
    
    Header: {
        encode: function( headers, xmlHttpRequest, httpRequestResponse ) {
            var header = '';
            if ( !headers ) return xhr ? xhr : header;
            var keys = KEYS(headers), key, i, l, k, kl, CRLF = RT.Const.CRLF;
            if ( httpRequestResponse )
            {
                for(i=0,l=keys.length; i<l; i++)
                {
                    key = keys[i];
                    // both single value and array
                    httpRequestResponse.setHeader(key, headers[key]);
                }
                return httpRequestResponse;
            }
            else if ( xmlHttpRequest )
            {
                for(i=0,l=keys.length; i<l; i++)
                {
                    key = keys[i];
                    if ( '[object Array]' === toString.call(headers[key]) )
                    {
                        for(k=0,kl=headers[key].length; k<kl; k++)
                            xmlHttpRequest.setRequestHeader(key, headers[key][k]);
                    }
                    else
                    {
                        xmlHttpRequest.setRequestHeader(key, headers[key]);
                    }
                }
                return xmlHttpRequest;
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
                        if ( header.length ) header += CRLF;
                        header += key + ': ' + String(headers[key]);
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
                        if ( header[HAS](key) )
                        {
                            if ( 'string' === typeof header[key] ) header[key] = [header[key]];
                            header[key].push( trim(parts.join(':')) );
                        }
                        else
                        {
                            header[key] = trim(parts.join(':'));
                        }
                    }
                    else if ( parts[0].length && key )
                    {
                        header[key] = CRLF + parts[0];
                    }
                }
            }
            return header;
        }
    }
};

RT.Client = function Client( cfg ) {
    var self = this;
    if ( !(self instanceof Client) ) return new Client( cfg );
    self.$cfg$ = cfg || { };
    self.$event$ = { };
    self.status = RT.Client.CREATED;
};

RT.Client.Impl = { };

RT.Client.CREATED = 1;
RT.Client.DESTROYED = 0;
RT.Client.OPENED = 2;
RT.Client.CLOSED = 4;
RT.Client.PENDING = 8;
RT.Client.ABORTED = 16;

RT.Client[PROTO] = {
     constructor: RT.Client
    ,status: RT.Client.CREATED
    ,$cfg$: null
    ,$event$: null
    ,dispose: function( ){
        var self = this;
        self.status = RT.Client.DESTROYED;
        self.$cfg$ = null;
        self.$event$ = null;
        return self;
    }
    ,config: function( key, val ) {
        var self = this, cfg = self.$cfg$;
        if ( key )
        {
            if ( arguments.length > 1 )
            {
                cfg[key] = val;
                return self;
            }
            else
            {
                return cfg[key];
            }
        }
    }
    ,on: function( event, handler, once ){
        var self = this;
        if ( !event || !handler ) return self;
        if ( !self.$event$[HAS](event) ) self.$event$[event] = [[handler, true===once, 0]];
        else self.$event$[event].push([handler, true===once, 0]);
        return self;
    }
    ,one: function( event, handler ){
        return this.on( event, handler, true );
    }
    ,off: function( event, handler ){
        var self = this;
        if ( !event || !self.$event$[HAS](event) ) return self;
        if ( null == handler )
        {
            delete self.$event$[event];
        }
        else
        {
            for(var handle=self.$event$[event],i=handle.length-1; i>=0; i--)
                if ( handle[i][0] === handler ) handler.splice(i, 1);
            if ( !handle.length ) delete self.$event$[event];
        }
        return self;
    }
    ,emit: function( event, data ){
        var self = this;
        if ( !event || !self.$event$[HAS](event) ) return self;
        var handler = self.$event$[event].slice( ), i, l = handler.length, h, rem = [];
        var evt = {event:event, data:data, target:self};
        for(i=0; i<l; i++)
        {
            h = handler[i];
            if ( h[1] ) rem.push( i );
            if ( !h[1] || !h[2] ) { h[2] = 1; h[0]( evt ); }
        }
        handler = self.$event$[event];
        for(i=rem.length-1; i>=0; i--) handler.splice( rem[i], 1 );
        if ( !handler.length ) delete self.$event$[event];
        return self;
    }
    ,abort: function( trigger, e ){
        this.status = RT.Client.ABORTED;
        return true === trigger ? this.emit( 'abort', e ) : this;
    }
    ,open: function( e ){
        this.status = RT.Client.OPENED;
        return this.emit( 'open', e );
    }
    ,close: function( e ){
        this.status = RT.Client.CLOSED;
        return this.emit( 'close', e );
    }
    ,send: function( payload ){
        return this;
    }
    ,listen: function( ){
        return this;
    }
    ,init: function( ){
        var self = this;
        setTimeout(function(){
            self.listen( );
        }, 40);
        return self;
    }
};
// aliases
RT.Client[PROTO].addEventListener = RT.Client[PROTO].on;
RT.Client[PROTO].removeEventListener = RT.Client[PROTO].off;
RT.Client[PROTO].trigger = RT.Client[PROTO].dispatchEvent = RT.Client[PROTO].emit;

// export it
return RT;
});
/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets / webrtc for Node/XPCOM/JS
*
*  @version: 1.1.0
*  https://github.com/foo123/RT
*
**/
!function(root, name, factory) {
"use strict";
if (('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import'])) /* XPCOM */
    (root.$deps = root.$deps||{}) && (root.EXPORTED_SYMBOLS = [name]) && (root[name] = root.$deps[name] = factory.call(root));
else if (('object'===typeof module)&&module.exports) /* CommonJS */
    (module.$deps = module.$deps||{}) && (module.exports = module.$deps[name] = factory.call(root));
else if (('function'===typeof define)&&define.amd&&('function'===typeof require)&&('function'===typeof require.specified)&&require.specified(name) /*&& !require.defined(name)*/) /* AMD */
    define(name,['module'],function(module) {factory.moduleUri = module.uri; return factory.call(root);});
else if (!(name in root)) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root)||1)&&('function'===typeof(define))&&define.amd&&define(function() {return root[name];});
}('undefined' !== typeof self ? self : this, 'RT', function ModuleFactory__RT() {
"use strict";

var root = this, PROTO = 'prototype', HAS = Object[PROTO].hasOwnProperty,
    KEYS = Object.keys, toString = Object[PROTO].toString,
    isXPCOM = ('undefined' !== typeof Components) && ('object' === typeof Components.classes) && ('object' === typeof Components.classesByID) && Components.utils && ('function' === typeof Components.utils['import']),
    isNode = ('undefined' !== typeof global) && ('[object global]' === toString.call(global)),
    isWebWorker = !isXPCOM && !isNode && ('undefined' !== typeof WorkerGlobalScope) && ('function' === typeof importScripts) && (navigator instanceof WorkerNavigator),
    isBrowser = !isXPCOM && !isNode && !isWebWorker && ('undefined' !== typeof navigator),
    XHR, Util, CC = String.fromCharCode,
    trim_re = /^\s+|\s+$/g,
    trim = String[PROTO].trim ? function(s) {return s.trim();} : function(s) {return s.replace(trim_re, '');},
    a2b_re = /[^A-Za-z0-9\+\/\=]/g, hex_re = /\x0d\x0a/g,
    UUID = 0
;

function RT(cfg)
{
    cfg = cfg || {};
    var type = (cfg.use || cfg.rt_type || 'default').toLowerCase();
    return HAS.call(RT.Client.Impl, type) ? (new RT.Client.Impl[type](cfg)) : (new RT.Client(cfg));
}
RT.VERSION = '1.1.0';

RT.Platform = {
    XPCOM       : isXPCOM,
    Node        : isNode,
    WebWorker   : isWebWorker,
    Browser     : isBrowser
};

XHR = RT.XHR = function XHR(send, abort) {
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
    xhr.send = function(payload) {
        if (aborted || (XHR.UNSENT !== xhr.readyState)) return xhr;
        if (send) send(payload);
        xhr.readyState = XHR.OPENED;
        return xhr;
    };
    xhr.abort = function() {
        if (aborted) return xhr;
        aborted = true;
        if (abort) abort();
        return xhr;
    };
    xhr.getAllResponseHeaders = function(decoded) {
        if (XHR.DONE !== xhr.readyState) return null;
        return true === decoded ? xhr._headers : xhr._rawHeaders;
    };
    xhr.getResponseHeader = function(key) {
        if ((null == key) || (XHR.DONE !== xhr.readyState)) return null;
        var headers = xhr._headers || {};
        key = key.toLowerCase();
        return HAS.call(headers, key) ? headers[key] : null;
    };
    xhr.dispose = function() {
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
        xhr.getAllResponseHeaders = null;
        xhr.getResponseHeader = null;
        xhr.send = null;
        xhr.abort = null;
        return xhr;
    };
};

XHR.UNSENT = 0;
XHR.OPENED = 1;
XHR.HEADERS_RECEIVED = 2;
XHR.LOADING = 3;
XHR.DONE = 4;

RT.UUID = function(PREFIX, SUFFIX) {
    return (PREFIX || '') + String((++UUID)) + '_' + String(Date.now()) + '_' + String(Math.floor((1000*Math.random()))) + (SUFFIX || '');
};

RT.Client = function Client(cfg) {
    var self = this;
    if (!(self instanceof Client)) return new Client(cfg);
    self.$cfg$ = cfg || {};
    self.$event$ = {};
    self.status = RT.Client.CREATED;
};

RT.Client.Impl = {};

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
    ,dispose: function() {
        var self = this;
        self.status = RT.Client.DESTROYED;
        self.$cfg$ = null;
        self.$event$ = null;
        return self;
    }
    ,config: function(key, val) {
        var self = this, cfg = self.$cfg$;
        if (key)
        {
            if (arguments.length > 1)
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
    ,on: function(event, handler, once) {
        var self = this;
        if (!event || !handler) return self;
        if (!HAS.call(self.$event$, event)) self.$event$[event] = [[handler, true === once, 0]];
        else self.$event$[event].push([handler, true === once, 0]);
        return self;
    }
    ,one: function(event, handler) {
        return this.on(event, handler, true);
    }
    ,off: function(event, handler) {
        var self = this;
        if (!event || !HAS.call(self.$event$, event)) return self;
        if (null == handler)
        {
            delete self.$event$[event];
        }
        else
        {
            for (var handle=self.$event$[event],i=handle.length-1; i>=0; --i)
                if (handle[i][0] === handler) handler.splice(i, 1);
            if (!handle.length) delete self.$event$[event];
        }
        return self;
    }
    ,emit: function(event, data) {
        var self = this;
        if (!event || !HAS.call(self.$event$, event)) return self;
        var handler = self.$event$[event].slice(), i, l = handler.length, h, rem = [];
        var evt = {event:event, data:data, target:self};
        for (i=0; i<l; ++i)
        {
            h = handler[i];
            if (h[1]) rem.push(i);
            if (!h[1] || !h[2]) {h[2] = 1; h[0](evt);}
        }
        handler = self.$event$[event];
        for (i=rem.length-1; i>=0; --i) handler.splice(rem[i], 1);
        if (!handler.length) delete self.$event$[event];
        return self;
    }
    ,abort: function(trigger, e) {
        this.status = RT.Client.ABORTED;
        return true === trigger ? this.emit('abort', e) : this;
    }
    ,open: function(e) {
        this.status = RT.Client.OPENED;
        return this.emit('open', e);
    }
    ,close: function(e) {
        this.status = RT.Client.CLOSED;
        return this.emit('close', e);
    }
    ,send: function(payload) {
        return this;
    }
    ,listen: function() {
        return this;
    }
    ,init: function() {
        var self = this;
        setTimeout(function() {
            self.listen();
        }, 40);
        return self;
    }
};
// aliases
RT.Client[PROTO].addEventListener = RT.Client[PROTO].on;
RT.Client[PROTO].removeEventListener = RT.Client[PROTO].off;
RT.Client[PROTO].trigger = RT.Client[PROTO].dispatchEvent = RT.Client[PROTO].emit;

// utils --------------------------
function xhr_client(o, payload)
{
    var xhr = null, $xhr$ = null, update;
    o = o || {};

    if (!o.url) return xhr;

    try {
        $xhr$ = 'undefined' !== typeof XMLHttpRequest ? (new XMLHttpRequest()) : (new ActiveXObject('Microsoft.XMLHTTP')) /* or ActiveXObject('Msxml2.XMLHTTP'); ??*/;
    } catch(e) {
        return xhr;
    }

    xhr = new XHR(
        function(payload) {$xhr$.send(payload);},
        function() {$xhr$.abort();}
    );

    update = function(xhr, $xhr$) {
        xhr.readyState = $xhr$.readyState;
        xhr.responseType = $xhr$.responseType;
        xhr.responseURL = $xhr$.responseURL;
        xhr.response = $xhr$.response;
        xhr.responseText = $xhr$.responseText;
        xhr.responseXml = $xhr$.responseXml;
        xhr.status = $xhr$.status;
        xhr.statusText = $xhr$.statusText;
        return xhr;
    };

    $xhr$.open(String(o.method || 'GET').toUpperCase(), o.url, !o.sync);
    xhr.responseType = $xhr$.responseType = o.responseType || 'text';
    $xhr$.timeout = o.timeout || 30000; // 30 secs default timeout

    if (o.onProgress)
    {
        $xhr$.onprogress = function() {
            o.onProgress(update(xhr, $xhr$));
        };
    }
    if (o.onLoadStart)
    {
        $xhr$.onloadstart = function() {
            o.onLoadStart(update(xhr, $xhr$));
        };
    }
    if (o.onLoadEnd)
    {
        $xhr$.onloadend = function() {
            o.onLoadEnd(update(xhr, $xhr$));
        };
    }
    if (!o.sync && o.onStateChange)
    {
        $xhr$.onreadystatechange = function() {
            o.onStateChange(update(xhr, $xhr$));
        };
    }
    $xhr$.onload = function() {
        update(xhr, $xhr$);
        xhr._rawHeaders = $xhr$.getAllResponseHeaders();
        xhr._headers = headers_decode(xhr._rawHeaders, true);
        if (RT.XHR.DONE === $xhr$.readyState)
        {
            if (200 === $xhr$.status)
            {
                if (o.onComplete) o.onComplete(xhr);
            }
            else
            {
                if (o.onRequestError) o.onRequestError(xhr);
                else if (o.onError) o.onError(xhr);
            }
        }
    };
    $xhr$.onabort = function() {
        if (o.onAbort) o.onAbort(update(xhr, $xhr$));
    };
    $xhr$.onerror = function() {
        if (o.onError) o.onError(update(xhr, $xhr$));
    };
    $xhr$.ontimeout = function() {
        if (o.onTimeout) o.onTimeout(update(xhr, $xhr$));
    };

    if (o.headers) headers_encode(o.headers, $xhr$);
    if (o.mimeType) $xhr$.overrideMimeType(o.mimeType);
    if (arguments.length > 1) xhr.send(payload);
    return xhr;
}
function xhr_xpcom(o, payload)
{
    var xhr = null, $xhr$ = null, update;
    o = o || {};

    if (!o.url) return xhr;

    try {
        $xhr$ = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
    } catch (e) {
        return xhr;
    }

    xhr = new XHR(
        function(payload) {$xhr$.send(payload);},
        function() {$xhr$.abort();}
    );

    update = function(xhr, $xhr$) {
        xhr.readyState = $xhr$.readyState;
        xhr.responseType = $xhr$.responseType;
        xhr.responseURL = $xhr$.responseURL;
        xhr.response = $xhr$.response;
        xhr.responseText = $xhr$.responseText;
        xhr.responseXml = $xhr$.responseXml;
        xhr.status = $xhr$.status;
        xhr.statusText = $xhr$.statusText;
        return xhr;
    };

    $xhr$.open(String(o.method || 'GET').toUpperCase(), o.url, !o.sync);
    xhr.responseType = $xhr$.responseType = o.responseType || 'text';
    $xhr$.timeout = o.timeout || 30000; // 30 secs default timeout

    if (o.onProgress)
    {
        $xhr$.addEventListener('progress', function() {
            o.onProgress(update(xhr, $xhr$));
        });
    }
    if (o.onLoadStart)
    {
        $xhr$.addEventListener('loadstart', function() {
            o.onLoadStart(update(xhr, $xhr$));
        });
    }
    if (!o.sync && o.onStateChange)
    {
        $xhr$.addEventListener('readystatechange', function() {
            o.onStateChange(update(xhr, $xhr$));
        });
    }
    $xhr$.addEventListener('load', function() {
        update(xhr, $xhr$);
        xhr._rawHeaders = $xhr$.getAllResponseHeaders();
        xhr._headers = headers_decode(xhr._rawHeaders, true);
        if (RT.XHR.DONE === $xhr$.readyState)
        {
            if (200 === $xhr$.status)
            {
                if (o.onComplete) o.onComplete(xhr);
            }
            else
            {
                if (o.onRequestError) o.onRequestError(xhr);
                else if (o.onError) o.onError(xhr);
            }
        }
    });
    $xhr$.addEventListener('abort', function() {
        if (o.onAbort) o.onAbort(update(xhr, $xhr$));
    });
    $xhr$.addEventListener('error', function() {
        if (o.onError) o.onError(update(xhr, $xhr$));
    });
    $xhr$.addEventListener('timeout', function() {
        if (o.onTimeout) o.onTimeout(update(xhr, $xhr$));
    });

    if (o.headers) headers_encode(o.headers, $xhr$);
    if (o.mimeType) $xhr$.overrideMimeType(o.mimeType);
    if (arguments.length > 1) xhr.send(payload);
    return xhr;
}
function xhr_node(o, payload)
{
    var xhr = null, $hr$ = null, update, url, opts;
    o = o || {};

    if (!o.url) return xhr;

    url = '[object Object]' === toString.call(o.url) ? o.url : require('url').parse(String(o.url)),
    opts = {
        method      : String(o.method || 'GET').toUpperCase(),
        agent       : false,
        protocol    : url.protocol,
        host        : url.hostname,
        hostname    : url.hostname,
        port        : url.port || ('https:' === url.protocol ? 443 : 80),
        path        : (url.pathname || '/') + (url.query ? ('?' + url.query) : '')
    };

    xhr = new XHR(
        function(payload) {
            if (null != payload)
            {
                payload = String(payload);
                $hr$.setHeader('Content-Length', String(payload.length));
                $hr$.write(payload);
            }
            $hr$.end();
        },
        function() {
            $hr$.abort();
        }
    );

    $hr$ = ('https:' === opts.protocol ? (require('https').request) : (require('http').request))(opts, function(response) {
        var xdata = '', data_sent = 0;

        xhr.readyState = RT.XHR.OPENED;
        if (o.onStateChange) o.onStateChange(xhr);

        xhr.readyState = RT.XHR.HEADERS_RECEIVED;
        xhr._rawHeaders = response.rawHeaders.join("\r\n");
        xhr._headers = response.headers;
        xhr.responseURL = response.url || null;
        xhr.status = response.statusCode || null;
        xhr.statusText = response.statusMessage || null;
        if (o.onStateChange) o.onStateChange(xhr);

        response.on('data', function(chunk) {
            xdata += chunk.toString();
            if (!data_sent)
            {
                data_sent = 1;
                xhr.readyState = RT.XHR.LOADING;
                if (o.onStateChange) o.onStateChange(xhr);
                if (o.onLoadStart) o.onLoadStart(xhr);
            }
            if (o.onProgress) o.onProgress(xhr);
        });
        response.on('end', function() {
            xhr.readyState = RT.XHR.DONE;
            xhr.responseType = 'text';
            xhr.response = xhr.responseText = xdata;

            if (o.onStateChange) o.onStateChange(xhr);
            if (o.onLoadEnd) o.onLoadEnd(xhr);

            if (RT.XHR.DONE === xhr.readyState)
            {
                if (200 === xhr.status)
                {
                    if (o.onComplete) o.onComplete(xhr);
                }
                else
                {
                    if (o.onRequestError) o.onRequestError(xhr);
                    else if (o.onError) o.onError(xhr);
                }
            }
        });
        response.on('error', function(ee) {
            xhr.statusText = ee.toString();
            if (o.onError) o.onError(xhr);
        });
    });
    $hr$.setTimeout(o.timeout || 30000, function(e) {
        if (o.onTimeout) o.onTimeout(xhr);
    });
    $hr$.on('abort', function(ee) {
        if (o.onAbort) o.onAbort(xhr);
    });
    $hr$.on('error', function(ee) {
        xhr.statusText = ee.toString();
        if (o.onError) o.onError(xhr);
    });
    if (o.headers) headers_encode(o.headers, null, $hr$);
    //if (o.mimeType) $hr$.overrideMimeType(o.mimeType);
    if (arguments.length > 1) xhr.send(payload);
    return xhr;
}
XHR.create = isXPCOM ? xhr_xpcom : (isNode ? xhr_node : xhr_client);

Util = RT.Util = {
Url: {
    create: function(o) {
        if (!o) return '';
        var urlString = [], queue, keys = KEYS(o), key, val, k, kl = keys.length, entry, i, l, kk,
            encode = Util.Url.encode, to_string;
        k = 0; queue = k < kl ? [[key=keys[k++], o[key]]] : [];
        while (queue.length)
        {
            entry = queue.shift();
            key = entry[0]; val = entry[1];
            to_string = toString.call(val);
            if ('[object Array]' === to_string)
            {
                key += '[]';
                for (i=0,l=val.length; i<l; ++i)
                    queue.unshift([ key, val[i]]);
            }
            else if ('[object Object]' === to_string)
            {
                kk = KEYS(val);
                for (i=0,l=kk.length; i<l; ++i)
                    queue.unshift([key+'['+kk[i]+']', val[kk[i]]]);
            }
            else
            {
                urlString.push(encode(key) + '=' + encode(val));
            }
            if (!queue.length && k < kl) queue.unshift([key=keys[k++], o[key]]);
        }
        return urlString.join('&');
    },
    rawencode: function(s) {
        return encodeURIComponent(String(s))
            .split('!').join('%21')
            .split("'").join('%27')
            .split('(').join('%28')
            .split(')').join('%29')
            .split('*').join('%2A')
            //.split('~').join('%7E')
        ;
    },
    rawdecode: function(s) {
        return decodeURIComponent(String(s));
    },
    encode: function(s) {
        return Util.Url.rawencode(s).split('%20').join('+');
    },
    decode: function(s) {
        return Util.Url.rawdecode(String(s).split('+').join('%20'));
    }
}
};
function headers_encode(headers, xmlHttpRequest, httpRequestResponse)
{
    var header = '';
    if (!headers) return header;
    var keys = KEYS(headers), key, i, l, k, kl, CRLF = "\r\n";
    if (httpRequestResponse)
    {
        for (i=0,l=keys.length; i<l; ++i)
        {
            key = keys[i];
            // both single value and array
            httpRequestResponse.setHeader(key, headers[key]);
        }
        return httpRequestResponse;
    }
    else if (xmlHttpRequest)
    {
        for(i=0,l=keys.length; i<l; ++i)
        {
            key = keys[i];
            if ('[object Array]' === toString.call(headers[key]))
            {
                for (k=0,kl=headers[key].length; k<kl; ++k)
                    xmlHttpRequest.setRequestHeader(key, String(headers[key][k]));
            }
            else
            {
                xmlHttpRequest.setRequestHeader(key, String(headers[key]));
            }
        }
        return xmlHttpRequest;
    }
    else
    {
        for(i=0,l=keys.length; i<l; ++i)
        {
            key = keys[i];
            if ('[object Array]' === toString.call(headers[key]))
            {
                if (header.length) header += CRLF;
                header += key + ': ' + String(headers[key][0]);
                for (k=1,kl=headers[key].length; k<kl; ++k)
                    header += CRLF + String(headers[key][k]);
            }
            else
            {
                if (header.length) header += CRLF;
                header += key + ': ' + String(headers[key]);
            }
        }
        return header;
    }
}
function headers_decode(headers, lowercase)
{
    var header = {}, key = null, parts, i, l, line;
    if (headers)
    {
        lowercase = true === lowercase;
        headers = headers.split(/[\r\n]+/g);
        for (i=0,l=headers.length; i<l; ++i)
        {
            line = headers[i];
            parts = line.split(':', 2);
            if (parts.length > 1)
            {
                key = trim(parts[0]);
                if (lowercase) key = key.toLowerCase();
                if (HAS.call(header, key))
                {
                    if ('string' === typeof header[key]) header[key] = [header[key]];
                    header[key].push(trim(parts[1]));
                }
                else
                {
                    header[key] = trim(parts.join(':'));
                }
            }
            else if (parts[0].length && key)
            {
                header[key] = parts[0];
            }
        }
    }
    return header;
}

// export it
return RT;
});
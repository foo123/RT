/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets / webrtc for Node/XPCOM/JS
*  RT Poll Client
*
*  @version: 1.1.0
*  https://github.com/foo123/RT
*
**/
!function(root, factory) {
"use strict";
if (('object'===typeof module) && module.exports) /* CommonJS */
    module.exports = factory.call(root,(module.$deps && module.$deps["RT"]) || require("./RT"));
else if (("function"===typeof define) && define.amd && ("function"===typeof require) && ("function"===typeof require.specified) && require.specified("RT_Poll") /*&& !require.defined("RT_Poll")*/)
    define("RT_Poll",['module',"RT"],function(mod,module) {factory.moduleUri = mod.uri; factory.call(root,module); return module;});
else /* Browser/WebWorker/.. */
    (factory.call(root,root["RT"])||1)&&('function'===typeof define)&&define.amd&&define(function() {return root["RT"];});
}('undefined' !== typeof self ? self : this, function ModuleFactory__RT_Poll(RT) {
"use strict";

var PROTO = 'prototype',
    RT_Client = RT.Client,
    __super__ = RT_Client[PROTO],
    XHR = RT.XHR
;

var Client_Poll = RT_Client.Poll = function Client_Poll(cfg) {
    var self = this;
    if (!(self instanceof Client_Poll)) return new Client_Poll(cfg);
    __super__.constructor.call(self, cfg);
    self.$cfg$.pollInterval = self.$cfg$.pollInterval || 1000;
    self.$timer$ = null;
    self.$xhr$ = null;
    self.$mID$ = 0;
    self.$queue$ = [];
};
RT_Client.Impl['poll'] = RT_Client.Impl['short-poll'] = Client_Poll;

/* extends RT.Client class */
Client_Poll[PROTO] = Object.create(__super__);
Client_Poll[PROTO].constructor = Client_Poll;
Client_Poll[PROTO].$timer$ = null;
Client_Poll[PROTO].$xhr$ = null;
Client_Poll[PROTO].$queue$ = null;
Client_Poll[PROTO].$mID$ = null;
Client_Poll[PROTO].dispose = function() {
    var self = this;
    if (self.$timer$) {clearTimeout(self.$timer$); self.$timer$ = null;}
    if (self.$xhr$) {self.$xhr$.abort().dispose(); self.$xhr$ = null;}
    self.$mID$ = null;
    self.$queue$ = null;
    return __super__.dispose.call(self);
};
Client_Poll[PROTO].abort = function(trigger) {
    var self = this;
    if (self.$timer$) {clearTimeout(self.$timer$); self.$timer$ = null;}
    if (self.$xhr$) {self.$xhr$.abort().dispose(); self.$xhr$ = null;}
    return __super__.abort.call(self, true === trigger);
};
Client_Poll[PROTO].send = function(payload) {
    var self = this;
    self.$queue$.push(String(payload));
    return self;
};
Client_Poll[PROTO].listen = function() {
    var self = this;
    if (null == self.$mID$) return self; // disposed
    var poll = function poll() {
        if (null == self.$mID$) return; // disposed
        var asUrlEncoded = 'urlencoded' === self.$cfg$.contentType, asXML = 'xml' === self.$cfg$.contentType,
            charset = self.$cfg$.charset ? ('charset=' + String(self.$cfg$.charset)) : 'charset=utf8',
            contentType = asXML ? 'text/xml' : (asUrlEncoded ? 'application/x-www-form-urlencoded' : 'text/plain'),
            headers = {
                'Content-Type'      : contentType + '; ' + charset,
                'X-RT--Poll'        : '1', // this uses polling
                'X-RT--Receive'     : '1', // receive incoming message(s)
                'X-RT--mID'         : self.$mID$
            },
            rt_msg = null, rt_msgs = null, rt_payload = null
        ;
        if (self.$queue$.length)
        {
            // send messages on same request
            rt_msgs = self.$queue$.slice();
            if (asXML)
            {
                headers['X-RT--Send'] = '1';
                rt_payload = rt_msgs.join('');
            }
            else if (asUrlEncoded)
            {
                headers['X-RT--Send'] = 'x-rt--payload';
                headers['X-RT--Message'] = rt_msg = RT.UUID('------_rt_msg_', '_------');
                rt_payload = 'x-rt--payload=' + XHR.querystring(rt_msgs.join(rt_msg));
            }
            else
            {
                headers['X-RT--Send'] = '1';
                headers['X-RT--Message'] = rt_msg = RT.UUID('------_rt_msg_', '_------');
                rt_payload = rt_msgs.join(rt_msg);
            }
        }
        self.$xhr$ = XHR.create({
            url             : self.$cfg$.endpoint + (-1 < self.$cfg$.endpoint.indexOf('?') ? '&' : '?') + '__nocache__=' + (new Date().getTime()),
            method          : 'POST',
            responseType    : /*asXML ? 'xml' :*/ 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : headers,
            onError         : function(xhr) {
                self.$xhr$ = null;
                self.emit('error', xhr.statusText);
            },
            onTimeout       : function(xhr) {
                self.$xhr$ = null;
                self.$timer$ = setTimeout(poll, self.$cfg$.pollInterval);
            },
            onComplete      : function(xhr) {
                var rt_msg = xhr.getResponseHeader('X-RT--Message'),
                    rt_mID = xhr.getResponseHeader('X-RT--mID'),
                    rt_close = xhr.getResponseHeader('X-RT--Close'),
                    rt_error = xhr.getResponseHeader('X-RT--Error')
                ;
                self.$xhr$ = null;

                if (rt_error)
                    return self.emit('error', rt_error);

                // messages sent, remove them from queue
                if (rt_msgs)
                    self.$queue$.splice(0, rt_msgs.length);

                if (rt_mID)
                    self.$mID$ = rt_mID;

                if (rt_msg)
                {
                    // at the same time, handle incoming message(s)
                    var received = (xhr.responseText || '').split(rt_msg), i, l;
                    for (i=0,l=received.length; i<l; ++i) self.emit('receive', received[i]);
                }
                else if (xhr.responseText && xhr.responseText.length)
                {
                    self.emit('receive', xhr.responseText);
                }

                if (rt_close)
                    return self.close();

                self.$timer$ = setTimeout(poll, self.$cfg$.pollInterval);
            }
        }, rt_payload);
    };
    self.$timer$ = setTimeout(poll, 10);
    return self.open();
};

// export it
return RT;
});
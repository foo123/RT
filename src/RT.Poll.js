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
    factory( root['RT'] ) && ('function' === typeof define) && define.amd && define(function( ){ return root['RT']; });
}(this, function( RT ) {
"use strict";

var PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
    __super__ = RT.Client[PROTO], U = RT.Util, XHR = RT.XHR
;

RT.Client.Poll = function Client_Poll( cfg ) {
    var self = this;
    if ( !(self instanceof Client_Poll) ) return new Client_Poll(cfg);
    __super__.constructor.call( self, cfg );
    self.$cfg$.pollInterval = self.$cfg$.pollInterval || 1000;
    self.$timer$ = null;
    self.$xhr$ = null;
    self.$timestamp$ = 0;
    self.$queue$ = [];
};
RT.Client.Impl['poll'] = RT.Client.Impl['short-poll'] = RT.Client.Poll;

/* extends RT.Client class */
RT.Client.Poll[PROTO] = Object.create( __super__ );
RT.Client.Poll[PROTO].constructor = RT.Client.Poll;
RT.Client.Poll[PROTO].$timer$ = null;
RT.Client.Poll[PROTO].$xhr$ = null;
RT.Client.Poll[PROTO].$queue$ = null;
RT.Client.Poll[PROTO].$timestamp$ = null;
RT.Client.Poll[PROTO].dispose = function( ){
    var self = this;
    self.abort( );
    self.$timestamp$ = null;
    self.$queue$ = null;
    return __super__.dispose.call( self );
};
RT.Client.Poll[PROTO].abort = function( trigger ){
    var self = this;
    if ( self.$timer$ ) { clearTimeout( self.$timer$ ); self.$timer$ = null; }
    if ( self.$xhr$ ) { self.$xhr$.abort( true===trigger ); self.$xhr$ = null; }
    return self;
};
RT.Client.Poll[PROTO].$poll$ = function( immediate ){
    var self = this;
    var poll = function poll( ) {
        var headers = {
            'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
            'X-RT-Receive'      : '1', // receive incoming message(s)
            'X-RT-Timestamp'    : self.$timestamp$
        };
        var rt_msg = null, msgs = null;
        if ( self.$queue$.length )
        {
            // send message(s) on same request
            headers['X-RT-Send'] = '1';
            headers['X-RT-Message'] = rt_msg = RT.UUID('----------------------');
            msgs = self.$queue$.slice( );
        }
        self.$xhr$ = XHR.create({
            url             : self.$cfg$.url + (-1 < self.$cfg$.url.indexOf('?') ? '&' : '?') + '__NOCACHE__='+(new Date().getTime()),
            method          : 'POST',
            responseType    : 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : headers,
            onError         : function( xhr ) {
                self.emit('error', xhr.statusText);
            },
            onTimeout       : function( xhr ) {
                self.$timer$ = setTimeout(poll, self.$cfg$.pollInterval);
            },
            onComplete      : function( xhr ) {
                var rt_msg = xhr.responseHeader( 'X-RT-Message' ),
                    rt_close = xhr.responseHeader( 'X-RT-Close' ),
                    rt_error = xhr.responseHeader( 'X-RT-Error' ),
                    rt_timestamp = xhr.responseHeader( 'X-RT-Timestamp' )
                ;
                if ( rt_error )
                {
                    self.emit( 'error', rt_error );
                    return;
                }
                if ( rt_close )
                {
                    self.close( );
                    return;
                }
                if ( rt_msg )
                {
                    // at the same time, handle incoming message(s)
                    var msgs = (xhr.responseText||'').split( rt_msg ), i, l;
                    for(i=0,l=msgs.length; i<l; i++)
                        self.emit('receive', msgs[i]);
                }
                if ( rt_timestamp ) self.$timestamp$ = rt_timestamp;
                // message(s) sent
                if ( msgs ) self.$queue$.splice( 0, msgs.length );
                self.$timer$ = setTimeout(poll, self.$cfg$.pollInterval);
            }
        }, msgs ? ('rt_payload='+U.Url.encode( msgs.join( rt_msg ) )) : null);
    };
    self.$timer$ = setTimeout(poll, true === immediate ? 0 : self.$cfg$.pollInterval);
    return self;
};
RT.Client.Poll[PROTO].send = function( payload ){
    var self = this;
    self.$queue$.push( String(payload) );
    return self;
};
RT.Client.Poll[PROTO].listen = function( ){
    var self = this;
    return self.emit( 'open' ).$poll$( true );
};

// export it
return RT;
});
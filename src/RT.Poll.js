/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets for Node/JS
*  RT Poll Client
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
    __super__ = RT.Client[PROTO], U = RT.Util, XHR = RT.XHR
;

RT.Client.Poll = function Client_Poll( cfg ) {
    var self = this;
    if ( !(self instanceof Client_Poll) ) return new Client_Poll(cfg);
    __super__.constructor.call( self, cfg );
    self.$cfg$.pollInterval = self.$cfg$.pollInterval || 1000;
    self.$timer$ = null;
    self.$xhr$ = null;
    self.$mID$ = 0;
    self.$queue$ = [];
};
RT.Client.Impl['poll'] = RT.Client.Impl['short-poll'] = RT.Client.Poll;

/* extends RT.Client class */
RT.Client.Poll[PROTO] = Object.create( __super__ );
RT.Client.Poll[PROTO].constructor = RT.Client.Poll;
RT.Client.Poll[PROTO].$timer$ = null;
RT.Client.Poll[PROTO].$xhr$ = null;
RT.Client.Poll[PROTO].$queue$ = null;
RT.Client.Poll[PROTO].$mID$ = null;
RT.Client.Poll[PROTO].dispose = function( ){
    var self = this;
    if ( self.$timer$ ) { clearTimeout( self.$timer$ ); self.$timer$ = null; }
    if ( self.$xhr$ ) { self.$xhr$.abort( false ); self.$xhr$ = null; }
    self.$mID$ = null;
    self.$queue$ = null;
    return __super__.dispose.call( self );
};
RT.Client.Poll[PROTO].abort = function( trigger ){
    var self = this;
    if ( self.$timer$ ) { clearTimeout( self.$timer$ ); self.$timer$ = null; }
    if ( self.$xhr$ ) { self.$xhr$.abort( true===trigger ); self.$xhr$ = null; }
    return __super__.abort.call( self, true===trigger );
};
RT.Client.Poll[PROTO].send = function( payload ){
    var self = this;
    self.$queue$.push( String(payload) );
    return self;
};
RT.Client.Poll[PROTO].listen = function( ){
    var self = this;
    var poll = function poll( ) {
        var headers = {
            'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
            'X-RT--Poll'        : '1', // this uses polling
            'X-RT--Receive'     : '1', // receive incoming message(s)
            'X-RT--mID'         : self.$mID$
        };
        var rt_msg = null, msgs = null;
        if ( self.$queue$.length )
        {
            // send message(s) on same request
            headers['X-RT--Send'] = 'x-rt--payload';
            headers['X-RT--Message'] = rt_msg = RT.UUID('--------_rt_msg_', '_--------');
            msgs = self.$queue$.slice( );
        }
        self.$xhr$ = XHR.create({
            url             : self.$cfg$.endpoint + (-1 < self.$cfg$.endpoint.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
            method          : 'POST',
            responseType    : 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : headers,
            onError         : function( xhr ) {
                self.emit( 'error', xhr.statusText );
            },
            onTimeout       : function( xhr ) {
                self.$timer$ = setTimeout( poll, self.$cfg$.pollInterval );
            },
            onComplete      : function( xhr ) {
                var rt_msg = xhr.responseHeader( 'X-RT--Message' ),
                    rt_close = xhr.responseHeader( 'X-RT--Close' ),
                    rt_error = xhr.responseHeader( 'X-RT--Error' ),
                    rt_mID = xhr.responseHeader( 'X-RT--mID' )
                ;
                if ( rt_error )
                {
                    return self.emit( 'error', rt_error );
                }
                if ( rt_close )
                {
                    return self.close( );
                }
                if ( rt_msg )
                {
                    // at the same time, handle incoming message(s)
                    var msgs = (xhr.responseText||'').split( rt_msg ), i, l;
                    for(i=0,l=msgs.length; i<l; i++) self.emit( 'receive', msgs[i] );
                }
                if ( rt_mID ) self.$mID$ = rt_mID;
                // message(s) sent
                if ( msgs ) self.$queue$.splice( 0, msgs.length );
                self.$timer$ = setTimeout(poll, self.$cfg$.pollInterval);
            }
        }, msgs ? ('x-rt--payload='+U.Url.encode( msgs.join( rt_msg ) )) : null);
    };
    self.$timer$ = setTimeout( poll, 0 );
    return self.open( );
};

// export it
return RT;
});
/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets for Node/JS
*  RT BOSH Client
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

RT.Client.BOSH = function Client_Bosh( cfg ) {
    var self = this;
    if ( !(self instanceof Client_Bosh) ) return new Client_Bosh(cfg);
    __super__.constructor.call( self, cfg );
    self.$cfg$.timeout = self.$cfg$.timeout || 5000;
    self.$send$ = null;
    self.$recv$ = null;
    self.$queue$ = [];
    self.$mID$ = 0;
};
RT.Client.Impl['bosh'] = RT.Client.Impl['long-poll'] = RT.Client.BOSH;

/* extends RT.Client class */
RT.Client.BOSH[PROTO] = Object.create( __super__ );
RT.Client.BOSH[PROTO].constructor = RT.Client.BOSH;
RT.Client.BOSH[PROTO].$send$ = null;
RT.Client.BOSH[PROTO].$recv$ = null;
RT.Client.BOSH[PROTO].$queue$ = null;
RT.Client.BOSH[PROTO].$mID$ = null;
RT.Client.BOSH[PROTO].dispose = function( ){
    var self = this;
    if ( self.$recv$ ) { self.$recv$.abort( ); self.$recv$ = null; }
    if ( self.$send$ ) { self.$send$.abort( ); self.$send$ = null; }
    self.$queue$ = null;
    self.$mID$ = null;
    return __super__.dispose.call( self );
};
RT.Client.BOSH[PROTO].abort = function( trigger ){
    var self = this;
    if ( self.$recv$ ) { self.$recv$.abort( ); self.$recv$ = null; }
    if ( self.$send$ ) { self.$send$.abort( ); self.$send$ = null; }
    return __super__.abort.call( self, true===trigger );
};
RT.Client.BOSH[PROTO].send = function( payload ){
    var self = this;
    var send = function send( ) {
        var rt_msgs = self.$queue$.slice( ),
            rt_msg = RT.UUID('--------_rt_msg_', '_--------');
        
        self.$send$ = XHR.create({
            url             : self.$cfg$.endpoint + (-1 < self.$cfg$.endpoint.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
            method          : 'POST',
            responseType    : 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : {
                'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
                'X-RT--BOSH'        : '1', // this uses BOSH
                'X-RT--Send'        : 'x-rt--payload', // this is the send channel
                'X-RT--Message'     : rt_msg
            },
            onError         : function( xhr ) {
                self.$send$ = null;
                self.emit( 'error', xhr.statusText );
            },
            onTimeout       : function( xhr ) {
                self.$send$ = null;
                // more messages pending? send new
                if ( self.$queue$.length ) setTimeout( send, 100 );
            },
            onComplete      : function( xhr ) {
                self.$send$ = null;
                
                if ( xhr.getResponseHeader( 'X-RT--Error' ) )
                    return self.emit( 'error', rt_error );
                
                // message(s) sent
                self.$queue$.splice( 0, rt_msgs.length );
                
                // more messages pending? send new
                if ( self.$queue$.length ) setTimeout( send, 10 );
            }
        }, 'x-rt--payload='+U.Url.encode( rt_msgs.join( rt_msg ) ));
    };
    self.$queue$.push( String(payload) );
    // if not send in progress, send now
    if ( !self.$send$ ) setTimeout( send, 0 );
    return self;
};
RT.Client.BOSH[PROTO].listen = function( ){
    var self = this;
    var receive = function receive( ) {
        self.$recv$ = XHR.create({
            url             : self.$cfg$.endpoint + (-1 < self.$cfg$.endpoint.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
            timeout         : self.$cfg$.timeout,
            method          : 'POST',
            responseType    : 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : {
                'Connection'        : 'Keep-Alive',
                'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
                'X-RT--BOSH'        : '1', // this uses BOSH
                'X-RT--Receive'     : '1', // this is the receive channel
                'X-RT--mID'         : self.$mID$
            },
            onError         : function( xhr ) {
                self.$recv$ = null;
                self.emit( 'error', xhr.statusText );
            },
            onTimeout       : function( xhr ) {
                self.$recv$ = null;
                setTimeout( receive, 10 );
            },
            onComplete      : function( xhr ) {
                var rt_msg = xhr.getResponseHeader( 'X-RT--Message' ),
                    rt_mID = xhr.getResponseHeader( 'X-RT--mID' ),
                    rt_close = xhr.getResponseHeader( 'X-RT--Close' ),
                    rt_error = xhr.getResponseHeader( 'X-RT--Error' )
                ;
                self.$recv$ = null;
                
                if ( rt_error )
                    return self.emit( 'error', rt_error );
                
                if ( rt_close )
                    return self.close( );
                
                if ( rt_mID )
                    self.$mID$ = rt_mID;
                
                if ( rt_msg )
                {
                    // at the same time, handle incoming message(s)
                    var received = (xhr.responseText||'').split( rt_msg ), i, l;
                    for(i=0,l=received.length; i<l; i++) self.emit( 'receive', received[i] );
                }
                else if ( !!xhr.responseText )
                {
                    self.emit( 'receive', xhr.responseText );
                }
                
                setTimeout( receive, 10 );
            }
        }, null);
    };
    setTimeout( receive, 10 );
    return self.open( );

};

// export it
return RT;
});
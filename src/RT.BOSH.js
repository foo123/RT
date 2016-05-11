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
    self.$cfg$.timeout = self.$cfg$.timeout || 1000;
    self.$bosh$ = null;
    self.$queue$ = [];
    self.$mID$ = 0;
};
RT.Client.Impl['bosh'] = RT.Client.Impl['long-poll'] = RT.Client.BOSH;

/* extends RT.Client class */
RT.Client.BOSH[PROTO] = Object.create( __super__ );
RT.Client.BOSH[PROTO].constructor = RT.Client.BOSH;
RT.Client.BOSH[PROTO].$bosh$ = null;
RT.Client.BOSH[PROTO].$queue$ = null;
RT.Client.BOSH[PROTO].$mID$ = null;
RT.Client.BOSH[PROTO].dispose = function( ){
    var self = this;
    if ( self.$bosh$ ) { self.$bosh$.abort( false ); self.$bosh$ = null; }
    self.$queue$ = null;
    self.$mID$ = null;
    return __super__.dispose.call( self );
};
RT.Client.BOSH[PROTO].abort = function( trigger ){
    var self = this;
    if ( self.$bosh$ ) { self.$bosh$.abort( true===trigger ); self.$bosh$ = null; }
    return __super__.abort.call( self, true===trigger );
};
RT.Client.BOSH[PROTO].send = function( payload ){
    var self = this;
    self.$queue$.push( String(payload) );
    return self;
};
RT.Client.BOSH[PROTO].listen = function( ){
    var self = this;
    var listen = function listen( ) {
        var headers = {
            'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
            'X-RT--BOSH'        : '1', // this uses BOSH
            'X-RT--Receive'     : '1', // this is the receive channel
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
        self.$bosh$ = XHR.create({
            url             : self.$cfg$.endpoint + (-1 < self.$cfg$.endpoint.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
            timeout         : self.$cfg$.timeout,
            method          : 'POST',
            responseType    : 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : headers,
            onError         : function( xhr ) {
                self.emit('error', xhr.statusText);
                self.$bosh$ = null;
            },
            onTimeout       : function( xhr ) {
                setTimeout( listen, 0 );
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
                    for(i=0,l=msgs.length; i<l; i++)
                        self.emit('receive', msgs[i]);
                }
                if ( rt_mID ) self.$mID$ = rt_mID;
                // message(s) sent
                if ( msgs ) self.$queue$.splice( 0, msgs.length );
                setTimeout( listen, 0 );
            }
        }, msgs ? ('x-rt--payload='+U.Url.encode( msgs.join( rt_msg ) )) : null);
    };
    setTimeout( listen, 0 );
    return self.open( );

};

// export it
return RT;
});
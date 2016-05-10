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
    self.$send$ = null;
    self.$recv$ = null;
    self.$mID$ = 0;
};
RT.Client.Impl['bosh'] = RT.Client.Impl['long-poll'] = RT.Client.BOSH;

/* extends RT.Client class */
RT.Client.BOSH[PROTO] = Object.create( __super__ );
RT.Client.BOSH[PROTO].constructor = RT.Client.BOSH;
RT.Client.BOSH[PROTO].$send$ = null;
RT.Client.BOSH[PROTO].$recv$ = null;
RT.Client.BOSH[PROTO].$mID$ = null;
RT.Client.BOSH[PROTO].dispose = function( ){
    var self = this;
    self.abort( );
    self.$mID$ = null;
    return __super__.dispose.call( self );
};
RT.Client.BOSH[PROTO].abort = function( trigger ){
    var self = this;
    //if ( self.$send$ ) { self.$send$.abort( true===trigger ); self.$send$ = null; }
    if ( self.$recv$ ) { self.$recv$.abort( true===trigger ); self.$recv$ = null; }
    self.$send$ = null;
    return self;
};
RT.Client.BOSH[PROTO].send = function( payload ){
    var self = this;
    XHR.create({
        url             : self.$cfg$.url + (-1 < self.$cfg$.url.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
        method          : 'POST',
        responseType    : 'text',
        //mimeType        : 'text/plain; charset=utf8',
        headers         : {
            'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
            'X-RT--BOSH'        : '1', // this uses BOSH
            'X-RT--Send'        : '1' // this is the send channel
        },
        onError         : function( xhr ) {
            self.emit('error', xhr.statusText);
        },
        onComplete      : function( xhr ) {
            var rt_close = xhr.responseHeader( 'X-RT--Close' ),
                rt_error = xhr.responseHeader( 'X-RT--Error' )
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
        }
    }, 'rt_payload='+U.Url.encode( String(payload) ));
    return self;
};
RT.Client.BOSH[PROTO].listen = function( ){
    var self = this;
    self.emit( 'open' );
    var listen = function listen( ) {
        self.$recv$ = XHR.create({
            url             : self.$cfg$.url + (-1 < self.$cfg$.url.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
            timeout         : self.$cfg$.timeout,
            method          : 'POST',
            responseType    : 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : {
                'Content-Type'      : 'application/x-www-form-urlencoded; charset=utf8',
                'X-RT--BOSH'        : '1', // this uses BOSH
                'X-RT--Receive'     : '1', // this is the receive channel
                'X-RT--mID'         : self.$mID$
            },
            onError         : function( xhr ) {
                self.emit('error', xhr.statusText);
                self.$recv$ = null;
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
                if ( rt_mID ) self.$mID$ = rt_mID;
                setTimeout( listen, 0 );
            }
        }, null);
    };
    setTimeout( listen, 0 );
    return self;
};

// export it
return RT;
});
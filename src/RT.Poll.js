/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets for Node/XPCOM/JS
*  RT Poll Client
*
*  @version: 1.0.1
*  https://github.com/foo123/RT
*
**/
!function( root, factory ) {
"use strict";
if ( ('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import']) )
    factory( root['RT'] );
else if ( 'object' === typeof exports )
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
    if ( self.$xhr$ ) { self.$xhr$.abort( ).dispose( ); self.$xhr$ = null; }
    self.$mID$ = null;
    self.$queue$ = null;
    return __super__.dispose.call( self );
};
RT.Client.Poll[PROTO].abort = function( trigger ){
    var self = this;
    if ( self.$timer$ ) { clearTimeout( self.$timer$ ); self.$timer$ = null; }
    if ( self.$xhr$ ) { self.$xhr$.abort( ).dispose( ); self.$xhr$ = null; }
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
        var asUrlEncoded = 'urlencoded' === self.$cfg$.contentType, asXML = 'xml' === self.$cfg$.contentType,
            charset = self.$cfg$.charset ? ('charset='+String(self.$cfg$.charset)) : 'charset=utf8',
            contentType = asXML ? 'text/xml' : (asUrlEncoded ? 'application/x-www-form-urlencoded' : 'text/plain'),
            headers = {
                'Content-Type'      : contentType + '; ' + charset,
                'X-RT--Poll'        : '1', // this uses polling
                'X-RT--Receive'     : '1', // receive incoming message(s)
                'X-RT--mID'         : self.$mID$
            },
            rt_msg = null, rt_msgs = null, rt_payload = null
        ;
        if ( self.$queue$.length )
        {
            // send message(s) on same request
            rt_msgs = self.$queue$.slice( );
            if ( asXML )
            {
                headers['X-RT--Send'] = '1';
                rt_payload = rt_msgs.join( '' );
            }
            else if ( asUrlEncoded )
            {
                headers['X-RT--Send'] = 'x-rt--payload';
                headers['X-RT--Message'] = rt_msg = RT.UUID('------_rt_msg_', '_------');
                rt_payload = 'x-rt--payload=' + U.Url.encode( rt_msgs.join( rt_msg ) );
            }
            else
            {
                headers['X-RT--Send'] = '1';
                headers['X-RT--Message'] = rt_msg = RT.UUID('------_rt_msg_', '_------');
                rt_payload = rt_msgs.join( rt_msg );
            }
        }
        self.$xhr$ = XHR.create({
            url             : self.$cfg$.endpoint + (-1 < self.$cfg$.endpoint.indexOf('?') ? '&' : '?') + '__nocache__='+(new Date().getTime()),
            method          : 'POST',
            responseType    : /*asXML ? 'xml' :*/ 'text',
            //mimeType        : 'text/plain; charset=utf8',
            headers         : headers,
            onError         : function( xhr ) {
                self.$xhr$ = null;
                self.emit( 'error', xhr.statusText );
            },
            onTimeout       : function( xhr ) {
                self.$xhr$ = null;
                self.$timer$ = setTimeout( poll, self.$cfg$.pollInterval );
            },
            onComplete      : function( xhr ) {
                var rt_msg = xhr.getResponseHeader( 'X-RT--Message' ),
                    rt_mID = xhr.getResponseHeader( 'X-RT--mID' ),
                    rt_close = xhr.getResponseHeader( 'X-RT--Close' ),
                    rt_error = xhr.getResponseHeader( 'X-RT--Error' )
                ;
                self.$xhr$ = null;
                
                if ( rt_error )
                    return self.emit( 'error', rt_error );
                
                if ( rt_close )
                    return self.close( );
                
                if ( rt_mID )
                    self.$mID$ = rt_mID;
                
                // message(s) sent
                if ( rt_msgs )
                    self.$queue$.splice( 0, rt_msgs.length );
                
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
                
                self.$timer$ = setTimeout( poll, self.$cfg$.pollInterval );
            }
        }, rt_payload);
    };
    self.$timer$ = setTimeout( poll, 10 );
    return self.open( );
};

// export it
return RT;
});
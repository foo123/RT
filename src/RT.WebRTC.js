/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets / webrtc for Node/XPCOM/JS
*  RT WebRTC Client
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

// TODO
return RT;
});
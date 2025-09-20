/**
*  RT
*  unified client-side real-time communication using (xhr) polling / bosh / (web)sockets / webrtc for Node/XPCOM/JS
*  RT WebRTC Client
*
*  @version: 1.1.0
*  https://github.com/foo123/RT
*
**/
!function(root, factory) {
"use strict";
if (('object'===typeof module) && module.exports) /* CommonJS */
    module.exports = factory.call(root,(module.$deps && module.$deps["RT"]) || require("./RT"));
else if (("function"===typeof define) && define.amd && ("function"===typeof require) && ("function"===typeof require.specified) && require.specified("RT_WebRTC") /*&& !require.defined("RT_WebRTC")*/)
    define("RT_WebRTC",['module',"RT"],function(mod,module) {factory.moduleUri = mod.uri; factory.call(root,module); return module;});
else /* Browser/WebWorker/.. */
    (factory.call(root,root["RT"])||1)&&('function'===typeof define)&&define.amd&&define(function() {return root["RT"];});
}('undefined' !== typeof self ? self : this, function ModuleFactory__RT_WebRTC(RT) {
"use strict";

/* !function( root, factory ) {
"use strict";
if ( ('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import']) )
    factory( root, root['RT'] );
else if ( 'object' === typeof exports )
    factory( root, require('./RT.js') );
else
    factory( root, root['RT'] ) && ('function' === typeof define) && define.amd && define(function( ){ return root['RT']; });
}(this, function( root, RT ) {*/

// TODO
return RT;
});
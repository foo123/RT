# RT

**RT** a versatile **Real-Time Communication Client** for JavaScript (Browser/Node/XPCOM/Flash)

![RT](/rt.jpg)


**supports**:

* [Polling](https://en.wikipedia.org/wiki/Polling_%28computer_science%29)
* [BOSH](https://en.wikipedia.org/wiki/BOSH)
* [WebSocket](https://en.wikipedia.org/wiki/WebSocket) (Browser/Node/XPCOM/Flash platforms)
* [WebRTC](https://en.wikipedia.org/wiki/WebRTC) (TODO)



`RT` is not only a simple framework around real-time layer implementations, it is also a small protocol additional to an implementation, which enables optimum performance, e.g by multiplexing multiple requests transparently (where applicable).


**NB**: Some `BOSH` implementations are actually `XMPP-BOSH` implementations, meaning they implement *XMPP over BOSH* i.e using `BOSH` technique and protocol for `XMPP`. `RT` implements just the `BOSH` layer, without the XMPP part, which of course can be added on top.



**Example API**

![RT Simple Chat](/rt_chat.png)


```javascript
// from real-time chat example

//e.g in node
/*
var RT = require('./RT.js');
require('./RT.Poll.js');
require('./RT.BOSH.js');
require('./RT.WebSocket.js');
*/
// in browser
/*
<script type="text/javascript" src="./RT.js"></script>
<script type="text/javascript" src="./RT.Poll.js"></script>
<script type="text/javascript" src="./RT.BOSH.js"></script>
<script type="text/javascript" src="./RT.WebSocket.js"></script>
*/

var rt_impl = 'ws' /* 'ws'=WebSocket, 'bosh'=BOSH, 'poll'=POll */;

var rt_chat = RT({
        use: rt_impl,
        endpoint: 'ws' === rt_impl ? 'ws://127.0.0.1:1111' : ('bosh' === rt_impl ? './relay.php?bosh=1' : './relay.php?poll=1')
    })
    .on('receive', function(evt) {
        if (!evt.data) return;
        var m = RT.Util.Json.decode(evt.data);
        output.innerHTML += '<div class="entry'+(m.user === user ? ' own' : '') + '">\
        <span class="user">' + userify(m.user) + '</span>\
        <span class="message">' + textify(m.message) + '</span>\
        </div>';
    })
    /*.one('open', function() {
        alert('OPENED');
    })*/
    .on('close', function() {
        alert('CLOSED!');
    })
    .on('error', function(evt) {
        alert('ERROR: ' + evt.data);
    })
    .init()
;

function send(event)
{
    if (RT.Client.OPENED !== rt_chat.status) return;
    if (event && (!key_is(event, 13) || event.shiftKey)) return;
    var msg = RT.Util.String.trim(input.value || '');
    input.value = '';
    if (!msg.length) return;
    rt_chat.send(RT.Util.Json.encode({
        'user': user,
        'message': msg
    }));
}
```

**see also:**

* [ModelView](https://github.com/foo123/modelview.js) a simple, fast, powerful and flexible MVVM framework for JavaScript
* [Contemplate](https://github.com/foo123/Contemplate) a fast and versatile isomorphic template engine for PHP, JavaScript, Python
* [HtmlWidget](https://github.com/foo123/HtmlWidget) html widgets, made as simple as possible, both client and server, both desktop and mobile, can be used as (template) plugins and/or standalone for PHP, JavaScript, Python (can be used as [plugins for Contemplate](https://github.com/foo123/Contemplate/blob/master/src/js/plugins/plugins.txt))
* [Paginator](https://github.com/foo123/Paginator)  simple and flexible pagination controls generator for PHP, JavaScript, Python
* [ColorPicker](https://github.com/foo123/ColorPicker) a fully-featured and versatile color picker widget
* [Pikadaytime](https://github.com/foo123/Pikadaytime) a refreshing JavaScript Datetimepicker that is lightweight, with no dependencies
* [Timer](https://github.com/foo123/Timer) count down/count up JavaScript widget
* [InfoPopup](https://github.com/foo123/InfoPopup) a simple JavaScript class to show info popups easily for various items and events (Desktop and Mobile)
* [Popr2](https://github.com/foo123/Popr2) a small and simple popup menu library
* [area-select.js](https://github.com/foo123/area-select.js) a simple JavaScript class to select rectangular regions in DOM elements (image, canvas, video, etc..)
* [area-sortable.js](https://github.com/foo123/area-sortable.js) simple and light-weight JavaScript class for handling smooth drag-and-drop sortable items of an area (Desktop and Mobile)
* [CanvasLite](https://github.com/foo123/CanvasLite) an html canvas implementation in pure JavaScript
* [css-color](https://github.com/foo123/css-color) simple class for manipulating color values and color formats for css, svg, canvas/image
* [img2svg](https://github.com/foo123/img2svg) vectorize image data to svg
* [svg2json](https://github.com/foo123/svg2json) parse svg to json
* [jquery-plugins](https://github.com/foo123/jquery-plugins) a collection of custom jQuery plugins
* [jquery-ui-widgets](https://github.com/foo123/jquery-ui-widgets) a collection of custom, simple, useful jQueryUI Widgets
* [touchTouch](https://github.com/foo123/touchTouch) a variation of touchTouch jQuery Optimized Mobile Gallery in pure vanilla JavaScript
* [Imagik](https://github.com/foo123/Imagik) fully-featured, fully-customisable and extendable Responsive CSS3 Slideshow
* [Carousel3](https://github.com/foo123/Carousel3) HTML5 Photo Carousel using Three.js
* [Rubik3](https://github.com/foo123/Rubik3) intuitive 3D Rubik Cube with Three.js
* [MOD3](https://github.com/foo123/MOD3) JavaScript port of AS3DMod ActionScript 3D Modifier Library
* [Geometrize](https://github.com/foo123/Geometrize) Computational Geometry and Rendering Library for JavaScript
* [EazyHttp](https://github.com/foo123/EazyHttp), easy, simple and fast HTTP requests for PHP, JavaScript, Python
* [RT](https://github.com/foo123/RT) a versatile real-time communication client for JavaScript supporting Polling / BOSH / WebSockets / WebRTC
* [AjaxListener.js](https://github.com/foo123/AjaxListener.js): Listen to any AJAX event on page with JavaScript, even by other scripts
* [asynchronous.js](https://github.com/foo123/asynchronous.js) simple manager for asynchronous, linear, parallel, sequential and interleaved tasks for JavaScript
* [classy.js](https://github.com/foo123/classy.js) Object-Oriented mini-framework for JavaScript


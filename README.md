# RT

![RT](/rt.jpg)


Unified Node/XPCOM/JS client-side real-time communication with underlying implementations for:

* [(XHR)](https://en.wikipedia.org/wiki/XMLHttpRequest) [Polling](https://en.wikipedia.org/wiki/Polling_%28computer_science%29)
* [BOSH](https://en.wikipedia.org/wiki/BOSH)
* [WebSocket](https://en.wikipedia.org/wiki/WebSocket) (native/flash/Node/XPCOM support)
* [WebRTC](https://en.wikipedia.org/wiki/WebRTC) (TODO)


**see also:**  

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node/XPCOM/JS, PHP, Python, ActionScript
* [HtmlWidget](https://github.com/foo123/HtmlWidget) html widgets used as (template) plugins and/or standalone for PHP, Node/XPCOM/JS, Python both client and server-side
* [Tao](https://github.com/foo123/Tao.js) A simple, tiny, isomorphic, precise and fast template engine for handling both string and live dom based templates
* [ModelView](https://github.com/foo123/modelview.js) a light-weight and flexible MVVM framework for JavaScript/HTML5
* [ModelView MVC jQueryUI Widgets](https://github.com/foo123/modelview-widgets) plug-n-play, state-full, full-MVC widgets for jQueryUI using modelview.js (e.g calendars, datepickers, colorpickers, tables/grids, etc..) (in progress)
* [Importer](https://github.com/foo123/Importer) simple class &amp; dependency manager and loader for PHP, Node/XPCOM/JS, Python
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node/XPCOM/JS, PHP, Python, ActionScript
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for Node/XPCOM/JS, PHP, Python, ActionScript
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL construction for PHP, Python, Node/XPCOM/JS, ActionScript
* [Xpresion](https://github.com/foo123/Xpresion) a simple and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, Node/XPCOM/JS, ActionScript
* [GrammarTemplate](https://github.com/foo123/GrammarTemplate) versatile and intuitive grammar-based templating for PHP, Python, Node/XPCOM/JS, ActionScript
* [GrammarPattern](https://github.com/foo123/GrammarPattern) versatile grammar-based pattern-matching for Node/XPCOM/JS (IN PROGRESS)
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node/XPCOM/JS, PHP, Python, ActionScript
* [DateX](https://github.com/foo123/DateX) eXtended &amp; localised Date parsing, diffing, formatting and validation for Node/XPCOM/JS, Python, PHP, ActionScript
* [Abacus](https://github.com/foo123/Abacus) a fast combinatorics and computation library for Node/JS, PHP, Python
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript



**Note** `RT` is not only a simple framework around real-time layer implementations, it is also a small protocol additional to an implementation, which enables optimum performance, e.g by multiplexing multiple requests transparently (where applicable).


* `RT` is also a `XPCOM JavaScript Component` (Firefox) (e.g to be used in firefox browser addons/plugins)



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
    .on('receive', function( evt ){
        if ( !evt.data ) return;
        var m = RT.Util.Json.decode( evt.data );
        output.innerHTML += '<div class="entry'+(m.user===user?' own':'')+'">\
        <span class="user">' + userify( m.user ) + '</span>\
        <span class="message">' + textify( m.message ) + '</span>\
        </div>';
    })
    /*.one('open', function( ){
        alert('OPENED');
    })*/
    .on('close', function( ){
        alert('CLOSED!');
    })
    .on('error', function( evt ){
        alert('ERROR: '+evt.data);
    })
    .init( )
;

function send( event )
{
    if ( RT.Client.OPENED !== rt_chat.status ) return;
    if ( event && (!key_is(event, 13) || event.shiftKey) ) return;
    var msg = RT.Util.String.trim( input.value||'' );
    input.value = '';
    if ( !msg.length ) return;
    rt_chat.send(RT.Util.Json.encode({
        'user': user,
        'message': msg
    }));
}
```


[Etymology of *"real"*](https://en.wiktionary.org/wiki/real)
 compare to [names/symbols of the sun](http://www.behindthename.com/names/meaning/sun) (e.g [Ra](https://en.wikipedia.org/wiki/Ra), [Surya](https://en.wikipedia.org/wiki/Surya), [Sol](https://en.wikipedia.org/wiki/Sol_%28mythology%29), [Helios](https://en.wikipedia.org/wiki/Helios))
 compare to [rajah](https://en.wiktionary.org/wiki/rajah#English), [pharaoh](https://en.wiktionary.org/wiki/pharaoh), [regal](https://en.wiktionary.org/wiki/regal), [royal](https://en.wiktionary.org/wiki/royal), [rex](https://en.wiktionary.org/wiki/rex#Latin), [tyrannus](https://en.wiktionary.org/wiki/%CF%84%CF%8D%CF%81%CE%B1%CE%BD%CE%BD%CE%BF%CF%82#Ancient_Greek) (e.g *"Oedipus Tyrannus"*, i.e *"Oedipus Rex"*)



[Etymology of *"hour"* (as in *"time"*, *"ώρα"*)](https://en.wiktionary.org/wiki/hour) compare to [Horus](https://en.wikipedia.org/wiki/Horus), [Helios](https://en.wikipedia.org/wiki/Helios)
compare to [*"ωραίο"*, oraío, (original: "timely","in time", metaphor for "beatiful")](https://en.wiktionary.org/wiki/%CF%89%CF%81%CE%B1%CE%AF%CE%BF%CF%82#Greek)



Really beatiful, isnt it? :))
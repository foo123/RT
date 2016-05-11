# RT

Unified Node/XPCOM/JS client-side real-time communication with underlying implementations for:

![RT](/rt.jpg)


* [(XHR)](https://en.wikipedia.org/wiki/XMLHttpRequest) [Polling](https://en.wikipedia.org/wiki/Polling_%28computer_science%29)
* [BOSH](https://en.wikipedia.org/wiki/BOSH)
* [WebSocket](https://en.wikipedia.org/wiki/WebSocket)



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
    /*.on('open', function( ){
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
"use strict";

var clients = [],
    // websocket server
    WebSocket = require('ws'),
    wss = new WebSocket.Server({
        host: '127.0.0.1', port: 1111, path: '',
    })
;

wss.on('connection', function(ws) {
    console.log('client connection');
    clients.push(ws);

    ws.on('close', function() {
        console.log('client connection closed');
        clients.splice(clients.indexOf(ws), 1);
    });

    ws.on('message', function(message) {
        for (var i=0,l=clients.length; i<l; ++i)
        {
            var client = clients[i];
            if (WebSocket.OPEN === client.readyState) client.send(message);
        }
    });
});
console.log('RT Chat Test (WebSocket) ws://127.0.0.1:1111');

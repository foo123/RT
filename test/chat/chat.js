"use strict";

var RT = require("../../src/RT.js");
require("../../src/RT.Poll.js");
require("../../src/RT.BOSH.js");
require("../../src/RT.WebSocket.js");

function parse_args(args)
{
    var
        Flags = {}, Options = {},  Params = [],
        optionname = '',  argumentforoption = false,
        arg, index, i, len, i0
    ;

    if (args)
    {
        i0 = 0;
    }
    else
    {
        args = process.argv;
        // remove firt 2 args ('node' and 'this filename')
        //args = args.slice(2);
        i0 = 2;
    }

    for (i=i0,len=args.length; i<len; ++i)
    {
        arg = args[i];
        if (arg.length > 1 && '-' == arg[0] && '-' != arg[1])
        {
            arg.slice(1).split('').forEach(function(c) {
                Flags[c] = true;
            });
            argumentforoption = false;
        }
        /*/^--/.test(arg)*/
        else if (/^--/.test(arg))
        {
            index = arg.indexOf('=');
            if (~index)
            {
                optionname = arg.slice(2, index);
                Options[optionname] = arg.slice(index + 1);
                argumentforoption = false;
            }
            else
            {
                optionname = arg.slice(2);
                Options[optionname] = true;
                argumentforoption = true;
            }
        }
        else
        {
            if (argumentforoption)
            {
                Options[optionname] = arg;
            }
            else
            {
                Params.push(arg);
            }
            argumentforoption = false;
        }
    }

    return {flags: Flags, options: Options, params: Params};
}

var args = parse_args();
var user = args.options['user'] || 'user';
var rt_impl = (args.options['use'] || 'poll').toLowerCase();
if ('poll' !== rt_impl && 'bosh' !== rt_impl && 'ws' !== rt_impl) rt_impl = 'poll';

console.log('user = ' + user);
console.log('use = ' + ('ws' === rt_impl ? 'WebSocket' : ('bosh' === rt_impl ? 'BOSH' : 'Poll')));
console.log('---------------------------------');

var rt_chat = RT({
        use: rt_impl,
        endpoint: 'ws' === rt_impl ? 'ws://127.0.0.1:1111' : ('bosh' === rt_impl ? 'http://127.0.0.1:2222/test/chat/relay.php?bosh=1' : 'http://127.0.0.1:2222/test/chat/relay.php?poll=1')
    })
    .on('receive', function(evt) {
        if (!evt.data) return;
        var m = JSON.parse(String(evt.data));
        console.log('user    : ' + m.user);
        console.log('message : ' + m.message);
    })
    /*.on('open', function(){
        console.log('OPENED');
    })*/
    .on('close', function() {
        console.log('CLOSED!');
    })
    .on('error', function(evt) {
        console.log('ERROR: ' + evt.data);
    })
    .init()
;

function send(msg, tries)
{
    if (RT.Client.OPENED !== rt_chat.status)
    {
        tries = tries || 0;
        if (tries < 5) setTimeout(function() {send(msg, tries + 1);}, 100);
        return;
    }
    msg = String(msg).trim();
    if (!msg.length) return;
    rt_chat.send(JSON.stringify({
        'user': user,
        'message': msg
    }));
}

if (args.options['msg']) send(args.options['msg']);

setTimeout(function() {rt_chat.close().dispose();}, 20000);
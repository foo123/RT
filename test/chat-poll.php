<?php
session_id('rt-chat-test');
session_start( );

if ( !isset($_SESSION['channel']) ) $_SESSION['channel'] = array('default'=>array());
$HEADER = (array)getallheaders();

$channel = empty($_GET['channel']) ? 'default' : $_GET['channel'];
if ( !isset($_SESSION['channel'][$channel]) ) $_SESSION['channel'][$channel] = array( );

if ( !empty($HEADER['X-RT--Send']) && !empty($_POST['rt_payload']) )
{
    $msgs = $_POST['rt_payload'];
    if ( !empty($HEADER['X-RT--Message']) ) $msgs = explode($HEADER['X-RT--Message'], $msgs);
    else $msgs = (array)$msgs;
    foreach($msgs as $msg) $_SESSION['channel'][$channel][] = $msg;
}

$c = count($_SESSION['channel'][$channel]);
header('X-RT--mID: '.$c);

if ( !empty($HEADER['X-RT--Receive']) )
{
    $rt_id = empty($HEADER['X-RT--mID']) ? 0 : (int)$HEADER['X-RT--mID'];
    if ( (0 <= $rt_id) && ($rt_id < $c) )
    {
        $msgs = array( );
        for($i=$rt_id; $i<$c; $i++) $msgs[] = $_SESSION['channel'][$channel][$i];
        if ( !empty($msgs) )
        {
            $rt_msg = '----------------------' . '_rt_msg_' . time( ) . '_' . mt_rand(1,1000);
            header('X-RT--Message: '.$rt_msg);
            echo implode($rt_msg, $msgs);
        }
    }
}

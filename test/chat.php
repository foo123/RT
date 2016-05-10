<?php
session_id('rt-chat-test3');
session_start( );

if ( !isset($_SESSION['channel']) ) $_SESSION['channel'] = array('default'=>array());
$HEADER = (array)getallheaders();

$timestamp = time( );
$channel = empty($_GET['channel']) ? 'default' : $_GET['channel'];
if ( !isset($_SESSION['channel'][$channel]) ) $_SESSION['channel'][$channel] = array( );

if ( !empty($HEADER['X-RT-Send']) && !empty($_POST['rt_payload']) )
{
    $msgs = $_POST['rt_payload'];
    if ( !empty($HEADER['X-RT-Message']) ) $msgs = explode($HEADER['X-RT-Message'], $msgs);
    else $msgs = (array)$msgs;
    
    foreach($msgs as $msg)
    {
        $msg = json_decode($msg, true);
        if ( empty($msg['user']) ) continue;
        $_SESSION['channel'][$channel][] = array(
            'user'      => $msg['user'],
            'message'   => $msg['message'],
            'timestamp' => $timestamp
        );
    }
}
header('X-RT-Timestamp: '.($timestamp));
if ( !empty($HEADER['X-RT-Receive']) )
{
    $receive_timestamp = empty($HEADER['X-RT-Timestamp']) ? 0 : (int)$HEADER['X-RT-Timestamp'];
    $rt_msg = '----------------------' . '_rt_msg_' . $timestamp . '_' . mt_rand(1,1000);
    $msgs = array();
    foreach($_SESSION['channel'][$channel] as $msg)
    {
        if ( $msg['timestamp'] > $receive_timestamp )
            $msgs[] = json_encode($msg);
    }
    if ( !empty($msgs) )
    {
        header('X-RT-Message: '.$rt_msg);
        echo implode($rt_msg, $msgs);
    }
}

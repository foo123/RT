<?php
$is_bosh = !empty($_GET['bosh']);

session_id($is_bosh ? 'rt-chat-test-bosh' : 'rt-chat-test');
session_start( );

if ( !isset($_SESSION['channel']) ) $_SESSION['channel'] = array('default'=>array());
$HEADER = (array)getallheaders();
$HEADER = array_combine(array_map('strtolower',array_keys($HEADER)), array_values($HEADER));

$channel = empty($_GET['channel']) ? 'default' : $_GET['channel'];
if ( !isset($_SESSION['channel'][$channel]) ) $_SESSION['channel'][$channel] = array( );

if ( !empty($HEADER['x-rt--send']) )
{
    $sent = $HEADER['x-rt--send']; $data = null;
    if ( '1' === $sent )
    {
        // in request body
        $data = @file_get_contents( 'php://input' );
    }
    elseif ( isset($_POST[$sent]) )
    {
        // in post data
        $data = $_POST[ $sent ];
    }
    if ( null !== $data )
    {
        if ( !empty($HEADER['x-rt--message']) ) $msgs = explode($HEADER['x-rt--message'], $data);
        else $msgs = (array)$data;
        foreach($msgs as $msg) $_SESSION['channel'][$channel][] = $msg;
    }
}

if ( !empty($HEADER['x-rt--receive']) )
{
    $rt_id = empty($HEADER['x-rt--mid']) ? 0 : (int)$HEADER['x-rt--mid'];
    if ( $rt_id < 0 )
    {
        header('X-RT--mID: '.count($_SESSION['channel'][$channel]));
        exit;
    }
    
    // long poll is here
    // if ( $is_bosh ) while ( $rt_id >= count($_SESSION['channel'][$channel]) ) sleep( 1 );
    
    $msgs = array( );
    $c = count($_SESSION['channel'][$channel]);
    for($i=$rt_id; $i<$c; $i++) $msgs[] = $_SESSION['channel'][$channel][$i];
    header('X-RT--mID: '.$c);
    if ( !empty($msgs) )
    {
        $rt_msg = '------_rt_msg_' . time( ) . '_' . mt_rand(1,1000) . '_------';
        header('X-RT--Message: '.$rt_msg);
        echo implode($rt_msg, $msgs);
    }
}
else
{
    header('X-RT--mID: '.count($_SESSION['channel'][$channel]));
}

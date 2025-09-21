<?php
// run php -S 127.0.0.1:2222
ob_start();
var_dump(getallheaders());
$headers = ob_get_clean();

ob_start();
var_dump($_POST);
$post = ob_get_clean();

header('X-RT--Close: 1');
echo $headers . "\r\n\r\n" . $post;
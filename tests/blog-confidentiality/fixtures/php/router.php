<?php
declare(strict_types=1);

// Explicit test dependency injection: built-in-server router execution must not
// depend on auto_prepend_file behavior. Native URL streams are disabled by the
// test process; the local custom wrapper is the only Graph transport allowed.
require_once __DIR__ . '/graph-fixture-wrapper.php';
if (!defined('BLOG_TEST_GRAPH_STUB_READY')) {
    http_response_code(500);
    exit('Synthetic Graph transport is unavailable.');
}
header('X-Blog-Test-Transport: synthetic');
$router = getenv('BLOG_TEST_BUILD_ROUTER');
if (!is_string($router) || !is_file($router)) {
    http_response_code(500);
    exit('Synthetic build router is unavailable.');
}
return require $router;

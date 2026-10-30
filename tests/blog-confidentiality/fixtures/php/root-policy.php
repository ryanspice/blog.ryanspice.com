<?php
declare(strict_types=1);

require $argv[1];
putenv('BLOG_PRIVATE_CONTENT_ROOT=' . $argv[2]);
unset($_SERVER['DOCUMENT_ROOT']);
if (blog_owner_root() !== null) exit(1);
$_SERVER['DOCUMENT_ROOT'] = $argv[2] . '/does-not-exist';
if (blog_owner_root() !== null) exit(2);
$_SERVER['DOCUMENT_ROOT'] = $argv[3];
if (blog_owner_root() === null) exit(3);
foreach (['articles', 'briefs'] as $nested) {
    $_SERVER['DOCUMENT_ROOT'] = $argv[2] . '/' . $nested;
    if (blog_owner_root() !== null) exit(4);
}
$_SERVER['DOCUMENT_ROOT'] = $argv[2];
if (blog_owner_root() !== null) exit(5);
echo "ROOT_POLICY_OK\n";

<?php
declare(strict_types=1);

/**
 * Test-only HTTPS stream wrapper. It answers the owner-guard Microsoft Graph
 * request from a synthetic profile file instead of contacting Microsoft. The
 * wrapper is only loaded through PHP's auto_prepend_file in the isolated
 * endpoint tests. Unlisted tokens return false, so the guard denies them.
 */
final class BlogConfidentialityGraphFixtureWrapper
{
    public $context;
    private string $body = '';
    private int $position = 0;

    public function stream_open(string $path, string $mode, int $options, ?string &$openedPath): bool
    {
        if (strpos($path, 'https://graph.microsoft.com/') !== 0) {
            return false;
        }

        $fixture = getenv('BLOG_TEST_GRAPH_FIXTURE');
        if (!is_string($fixture) || !is_file($fixture)) return false;

        $token = '';
        $options = stream_context_get_options($this->context);
        $headers = $options['http']['header'] ?? '';
        if (is_string($headers) && preg_match('/Authorization:\s*Bearer\s+([^\r\n]+)/i', $headers, $match)) {
            $token = trim($match[1]);
        }

        $profiles = json_decode((string) file_get_contents($fixture), true);
        if (!is_array($profiles) || !isset($profiles[$token]) || !is_array($profiles[$token])) {
            return false;
        }

        $encoded = json_encode($profiles[$token]);
        if (!is_string($encoded)) return false;
        $this->body = $encoded;
        return true;
    }

    public function stream_read(int $count): string
    {
        $chunk = substr($this->body, $this->position, $count);
        $this->position += strlen($chunk);
        return $chunk;
    }

    public function stream_eof(): bool
    {
        return $this->position >= strlen($this->body);
    }

    public function stream_stat(): array
    {
        return [];
    }

    public function stream_close(): void
    {
    }

    public function stream_set_option($option, $arg1, $arg2): bool
    {
        return false;
    }

    public function url_stat(string $path, int $flags)
    {
        return false;
    }
}

if (in_array('https', stream_get_wrappers(), true)) {
    @stream_wrapper_unregister('https');
}
if (!stream_wrapper_register('https', BlogConfidentialityGraphFixtureWrapper::class, 0)) {
    throw new RuntimeException('Synthetic Graph transport could not be registered.');
}
define('BLOG_TEST_GRAPH_STUB_READY', true);

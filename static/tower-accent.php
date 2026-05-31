<?php
declare(strict_types=1);

const FALLBACK_ACCENT = '#1e9bff';
const CACHE_TTL_SECONDS = 300;
const STALE_WHILE_REVALIDATE_SECONDS = 60;

$sources = [
	'https://tower-lights.herokuapp.com/scheduleComplete',
	'https://raw.githubusercontent.com/alexbelloni/cntowerlightsapi/master/routes/fakeDataFromCNTower.json',
	'https://raw.githubusercontent.com/alexbelloni/cntowerlightsapi/master/routes/fakeDataFromAPI.json',
];

$accent = read_cached_accent();
if ($accent === null) {
	$accent = resolve_accent($sources) ?? FALLBACK_ACCENT;
	write_cached_accent($accent);
}

header('Content-Type: text/css; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=' . CACHE_TTL_SECONDS . ', stale-while-revalidate=' . STALE_WHILE_REVALIDATE_SECONDS);
echo ':root{--accent:' . $accent . ';}' . "\n";

function read_cached_accent(): ?string
{
	$path = accent_cache_path();
	if (!is_file($path)) {
		return null;
	}

	$raw = @file_get_contents($path);
	if (!is_string($raw) || $raw === '') {
		return null;
	}

	$payload = json_decode($raw, true);
	if (!is_array($payload)) {
		return null;
	}

	$expiresAt = isset($payload['expires_at']) ? (int) $payload['expires_at'] : 0;
	$accent = isset($payload['accent']) ? (string) $payload['accent'] : '';

	if ($expiresAt <= time() || !is_supported_colour($accent)) {
		return null;
	}

	return $accent;
}

function write_cached_accent(string $accent): void
{
	if (!is_supported_colour($accent)) {
		return;
	}

	$path = accent_cache_path();
	$payload = json_encode([
		'accent' => $accent,
		'expires_at' => time() + CACHE_TTL_SECONDS,
	], JSON_UNESCAPED_SLASHES);

	if (!is_string($payload)) {
		return;
	}

	$tempPath = $path . '.' . getmypid() . '.tmp';
	if (@file_put_contents($tempPath, $payload, LOCK_EX) === false) {
		return;
	}

	if (!@rename($tempPath, $path)) {
		@unlink($tempPath);
	}
}

function accent_cache_path(): string
{
	return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'blog-ryanspice-tower-accent.json';
}

function resolve_accent(array $sources): ?string
{
	foreach ($sources as $source) {
		$payload = fetch_json((string) $source);
		if ($payload === null) {
			continue;
		}

		$accent = extract_first_colour($payload);
		if ($accent !== null && is_supported_colour($accent)) {
			return $accent;
		}
	}

	return null;
}

function fetch_json(string $url): mixed
{
	$raw = fetch_url($url);
	if ($raw === null || $raw === '') {
		return null;
	}

	$payload = json_decode($raw, true);
	return json_last_error() === JSON_ERROR_NONE ? $payload : null;
}

function fetch_url(string $url): ?string
{
	if (function_exists('curl_init')) {
		$handle = curl_init($url);
		if ($handle === false) {
			return null;
		}

		curl_setopt_array($handle, [
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_CONNECTTIMEOUT => 2,
			CURLOPT_TIMEOUT => 4,
			CURLOPT_HTTPHEADER => ['Accept: application/json'],
			CURLOPT_USERAGENT => 'blog.ryanspice.com tower accent',
		]);

		$body = curl_exec($handle);
		$status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
		curl_close($handle);

		return is_string($body) && $status >= 200 && $status < 300 ? $body : null;
	}

	$context = stream_context_create([
		'http' => [
			'header' => "Accept: application/json\r\nUser-Agent: blog.ryanspice.com tower accent\r\n",
			'timeout' => 4,
		],
	]);

	$body = @file_get_contents($url, false, $context);
	return is_string($body) ? $body : null;
}

function extract_first_colour(mixed $value, int $depth = 0): ?string
{
	if ($depth > 10) {
		return null;
	}

	if (is_string($value)) {
		return extract_colour_from_text($value);
	}

	if (!is_array($value)) {
		return null;
	}

	$priorityKeys = ['colourCaption', 'colorCaption', 'colour', 'color', 'colours', 'colors', 'configs', 'dates'];
	foreach ($priorityKeys as $key) {
		if (array_key_exists($key, $value)) {
			$accent = extract_first_colour($value[$key], $depth + 1);
			if ($accent !== null) {
				return $accent;
			}
		}
	}

	foreach ($value as $child) {
		$accent = extract_first_colour($child, $depth + 1);
		if ($accent !== null) {
			return $accent;
		}
	}

	return null;
}

function extract_colour_from_text(string $value): ?string
{
	$normalized = strtolower(trim($value));
	if ($normalized === '') {
		return null;
	}

	if (is_supported_colour($normalized)) {
		return $normalized;
	}

	foreach (preg_split('/[^a-z0-9#().,%\/\s-]+/', $normalized) ?: [] as $token) {
		$token = trim($token);
		if ($token !== '' && is_supported_colour($token)) {
			return $token;
		}
	}

	return null;
}

function is_supported_colour(string $value): bool
{
	if (preg_match('/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i', $value) === 1) {
		return true;
	}

	if (preg_match('/^(?:rgb|rgba|hsl|hsla)\([0-9.,%\/\s-]+\)$/i', $value) === 1) {
		return true;
	}

	return in_array(strtolower($value), css_colour_keywords(), true);
}

function css_colour_keywords(): array
{
	return [
		'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
		'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
		'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
		'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
		'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
		'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
		'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
		'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
		'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink',
		'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
		'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
		'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
		'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
		'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
		'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
		'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
		'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
		'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
		'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
		'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
		'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
		'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal',
		'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke',
		'yellow', 'yellowgreen',
	];
}

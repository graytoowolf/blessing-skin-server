<?php

namespace App\Services;

use Illuminate\Http\Request;

class ClientIP
{
    protected $request;

    protected $trustedProxies = [];

    public function __construct(?Request $request = null)
    {
        $this->request = $request ?? request();
        $this->trustedProxies = config('app.trusted_proxies', []);
    }

    public function get(): string
    {
        $whip = new Whip();
        $ip = $whip->getValidIpAddress();

        if ($this->isFromTrustedProxy()) {
            $forwardedIp = $this->getForwardedIP();
            if ($forwardedIp !== null) {
                $ip = $forwardedIp;
            }
        }

        return $ip;
    }

    protected function isFromTrustedProxy(): bool
    {
        $remoteIp = $this->request->getClientIp();

        if (empty($this->trustedProxies)) {
            return false;
        }

        if (in_array($remoteIp, $this->trustedProxies)) {
            return true;
        }

        foreach ($this->trustedProxies as $proxy) {
            if (strpos($proxy, '/') !== false) {
                if ($this->ipInCIDR($remoteIp, $proxy)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function getForwardedIP(): ?string
    {
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
        ];

        foreach ($headers as $header) {
            $value = $this->request->server($header);
            if (empty($value)) {
                continue;
            }

            $ips = array_map('trim', explode(',', $value));
            foreach ($ips as $ip) {
                if ($this->isValidIP($ip) && !$this->isTrustedProxy($ip)) {
                    return $ip;
                }
            }
        }

        return null;
    }

    protected function isValidIP(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP) !== false;
    }

    protected function isTrustedProxy(string $ip): bool
    {
        if (in_array($ip, $this->trustedProxies)) {
            return true;
        }

        foreach ($this->trustedProxies as $proxy) {
            if (strpos($proxy, '/') !== false) {
                if ($this->ipInCIDR($ip, $proxy)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function ipInCIDR(string $ip, string $cidr): bool
    {
        if (!function_exists('ip_in_range')) {
            return false;
        }

        list($subnet, $bits) = explode('/', $cidr);
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $bits);

        return ($ip & $mask) == ($subnet & $mask);
    }
}

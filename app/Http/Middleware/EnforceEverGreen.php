<?php

namespace App\Http\Middleware;

use App\Exceptions\PrettyPageException;
use Closure;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class EnforceEverGreen
{
    public function handle($request, Closure $next)
    {
        $userAgent = $request->userAgent();
        // 检查用户代理是否为搜索引擎蜘蛛
        $isCrawler = $this->isCrawler($userAgent);

        if (!$isCrawler) {
            preg_match('/Chrome\/(\d+)/', $userAgent, $matches);
            $isOldChrome = Arr::has($matches, 1) && $matches[1] < 55;

            if ($isOldChrome || Str::contains($userAgent, ['Trident', 'MSIE'])) {
                throw new PrettyPageException(trans('errors.http.ie'));
            }
        }
        return $next($request);
    }

    private function isCrawler($userAgent)
    {
        // 常见搜索引擎蜘蛛的用户代理字符串列表
        $crawlerUserAgents = [
            'Googlebot',
            'Bingbot',
            'Yahoo! Slurp',
            'DuckDuckBot',
            '360Spider',
            // 根据需要添加更多搜索引擎蜘蛛的用户代理字符串
        ];

        foreach ($crawlerUserAgents as $crawlerUserAgent) {
            if (Str::contains($userAgent, $crawlerUserAgent)) {
                return true;
            }
        }

        return false;
    }
}

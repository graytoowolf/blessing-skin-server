<?php

namespace App\Http\Middleware;

use App\Services\ImageManagerService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ImageOptimization
{
    protected $imageManager;

    public function __construct(ImageManagerService $imageManager)
    {
        $this->imageManager = $imageManager;
    }

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $response = $next($request);

        if (!$this->shouldOptimize($request, $response)) {
            return $response;
        }

        $content = $response->getContent();
        if (empty($content)) {
            return $response;
        }

        $acceptHeader = $request->header('Accept', '');
        $supportsWebP = str_contains($acceptHeader, 'image/webp');

        if ($supportsWebP && $this->canConvertToWebP($response)) {
            try {
                $webpContent = $this->convertToWebP($content);
                if ($webpContent !== false) {
                    $response->setContent($webpContent);
                    $response->headers->set('Content-Type', 'image/webp');
                    $response->headers->set('Vary', 'Accept');
                }
            } catch (\Exception $e) {
            }
        }

        return $response;
    }

    protected function shouldOptimize(Request $request, SymfonyResponse $response): bool
    {
        if ($request->isMethod('POST') || $request->isMethod('PUT')) {
            return false;
        }

        $contentType = $response->headers->get('Content-Type', '');
        if (!str_contains($contentType, 'image/')) {
            return false;
        }

        return true;
    }

    protected function canConvertToWebP(SymfonyResponse $response): bool
    {
        $contentType = $response->headers->get('Content-Type', '');
        return str_contains($contentType, 'image/png') ||
               str_contains($contentType, 'image/jpeg') ||
               str_contains($contentType, 'image/jpg');
    }

    protected function convertToWebP(string $content): string|false
    {
        try {
            $image = $this->imageManager->make($content);
            return (string) $image->encode('webp', option('image_webp_quality', 85))->getEncoded();
        } catch (\Exception $e) {
            return false;
        }
    }
}

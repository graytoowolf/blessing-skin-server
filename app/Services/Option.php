<?php

namespace App\Services;

use Illuminate\Database\QueryException;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class Option
{
    protected $items;

    protected static $memoryCache = [];

    public function __construct(Filesystem $filesystem)
    {
        $cachePath = storage_path('options.php');
        if ($filesystem->exists($cachePath)) {
            $this->items = collect($filesystem->getRequire($cachePath));

            return;
        }

        if (!file_exists(storage_path('install.lock')) || app()->runningUnitTests()) {
            $this->items = collect();
            return;
        }

        $this->items = DB::table('options')
            ->get()
            ->mapWithKeys(fn ($item) => [$item->option_name => $item->option_value]);
    }

    public function get($key, $default = null, $raw = false)
    {
        if (isset(self::$memoryCache[$key])) {
            $value = self::$memoryCache[$key];
            if ($raw) {
                return $value;
            }
            return $this->normalizeValue($value);
        }

        if (!$this->items->has($key) && Arr::has(config('options'), $key)) {
            $this->set($key, config("options.$key"));
        }

        $value = $this->items->get($key, $default);
        self::$memoryCache[$key] = $value;

        if ($raw) {
            return $value;
        }

        return $this->normalizeValue($value);
    }

    public function set($key, $value = null)
    {
        if (is_array($key)) {
            foreach ($key as $k => $v) {
                $this->set($k, $v);
            }
        } else {
            $this->items->put($key, $value);
            self::$memoryCache[$key] = $value;
            try {
                DB::table('options')->updateOrInsert(
                    ['option_name' => $key],
                    ['option_value' => $value]
                );
            } catch (QueryException $e) {
            }
        }
    }

    public function all(): array
    {
        return $this->items->all();
    }

    protected function normalizeValue($value)
    {
        switch (strtolower($value)) {
            case 'true':
            case '(true)':
                return true;

            case 'false':
            case '(false)':
                return false;

            case 'null':
            case '(null)':
                return null;

            default:
                return $value;
        }
    }

    public static function clearMemoryCache(): void
    {
        self::$memoryCache = [];
    }
}

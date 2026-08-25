<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Filesystem\Filesystem;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * TwigBridge 的编译缓存目录（storage/framework/views/twig）与 Laravel
     * view:clear 清理的 Blade compiled 目录不重合。更新模板后若残留旧编译
     * 产物，新版模板将不生效（表现为部署后页面样式仍是旧版）。
     */
    public function up(): void
    {
        $twigCachePath = storage_path('framework/views/twig');

        if (is_dir($twigCachePath)) {
            (new Filesystem())->cleanDirectory($twigCachePath);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};

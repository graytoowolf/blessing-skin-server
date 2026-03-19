<?php

namespace App\Services;

use Intervention\Image\ImageManager;

class ImageManagerService
{
    protected $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(['driver' => 'gd']);
    }

    public function make($image)
    {
        return $this->manager->make($image);
    }

    public function canvas($width, $height, $color = null)
    {
        return $this->manager->canvas($width, $height, $color);
    }

    public function configure(array $config = [])
    {
        return $this->manager->configure($config);
    }
}

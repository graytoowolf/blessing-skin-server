<?php

namespace App\Models;

use Illuminate\Support\Str;
use Laravel\Passport\Client as PassportClient;

class OAuthClient extends PassportClient
{
    protected static function booted()
    {
        static::creating(function (self $client) {
            if (empty($client->{$client->getKeyName()})) {
                $client->{$client->getKeyName()} = static::generateSecureClientId();
            }
        });
    }

    public static function generateSecureClientId(): string
    {
        do {
            $id = static::generateRandomId();
        } while (static::idExists($id));

        return $id;
    }

    protected static function generateRandomId(): string
    {
        $prefix = 'client_';
        $randomBytes = random_bytes(24);
        $randomString = bin2hex($randomBytes);

        return $prefix . $randomString;
    }

    protected static function idExists(string $id): bool
    {
        return static::where('id', $id)->exists();
    }

    public function getIncrementing()
    {
        return false;
    }

    public function getKeyType()
    {
        return 'string';
    }
}

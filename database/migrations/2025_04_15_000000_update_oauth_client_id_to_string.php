<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->migrateClientIds();

        Schema::table('oauth_clients', function (Blueprint $table) {
            $table->string('id', 64)->change();
        });

        Schema::table('oauth_access_tokens', function (Blueprint $table) {
            $table->string('client_id', 64)->change();
        });

        Schema::table('oauth_auth_codes', function (Blueprint $table) {
            $table->string('client_id', 64)->change();
        });

        Schema::table('oauth_personal_access_clients', function (Blueprint $table) {
            $table->string('client_id', 64)->change();
        });
    }

    protected function migrateClientIds(): void
    {
        if (!Schema::hasTable('oauth_clients')) {
            return;
        }

        $clients = DB::table('oauth_clients')->get();

        foreach ($clients as $client) {
            $oldId = $client->id;

            if (str_starts_with((string) $oldId, 'client_')) {
                continue;
            }

            $newId = $this->generateSecureClientId();

            DB::table('oauth_clients')
                ->where('id', $oldId)
                ->update(['id' => $newId]);

            DB::table('oauth_access_tokens')
                ->where('client_id', $oldId)
                ->update(['client_id' => $newId]);

            DB::table('oauth_auth_codes')
                ->where('client_id', $oldId)
                ->update(['client_id' => $newId]);

            DB::table('oauth_personal_access_clients')
                ->where('client_id', $oldId)
                ->update(['client_id' => $newId]);
        }
    }

    protected function generateSecureClientId(): string
    {
        do {
            $id = 'client_'.bin2hex(random_bytes(24));
        } while (DB::table('oauth_clients')->where('id', $id)->exists());

        return $id;
    }

    public function down(): void
    {
        Schema::table('oauth_clients', function (Blueprint $table) {
            $table->bigIncrements('id')->change();
        });

        Schema::table('oauth_access_tokens', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id')->change();
        });

        Schema::table('oauth_auth_codes', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id')->change();
        });

        Schema::table('oauth_personal_access_clients', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id')->change();
        });
    }
};

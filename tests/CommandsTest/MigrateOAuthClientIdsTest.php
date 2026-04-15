<?php

namespace Tests\CommandsTest;

use App\Console\Commands\MigrateOAuthClientIds;
use App\Models\OAuthClient;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MigrateOAuthClientIdsTest extends TestCase
{
    use DatabaseTransactions;

    public function testCommandHandlesEmptyClients()
    {
        $this->artisan('oauth:migrate-client-ids')
            ->expectsOutput('No OAuth clients found. Nothing to migrate.')
            ->assertSuccessful();
    }

    public function testCommandMigratesExistingClients()
    {
        DB::table('oauth_clients')->insert([
            'id' => 1,
            'user_id' => 1,
            'name' => 'Test Client',
            'secret' => 'test-secret',
            'redirect' => 'http://localhost/callback',
            'personal_access_client' => false,
            'password_client' => false,
            'revoked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('oauth:migrate-client-ids')
            ->expectsOutput('Starting OAuth client ID migration...')
            ->expectsOutput('Found 1 OAuth client(s) to migrate.')
            ->assertSuccessful();

        $client = DB::table('oauth_clients')->first();
        $this->assertStringStartsWith('client_', $client->id);
    }

    public function testCommandSkipsAlreadyMigratedClients()
    {
        $migratedId = 'client_'.bin2hex(random_bytes(24));

        DB::table('oauth_clients')->insert([
            'id' => $migratedId,
            'user_id' => 1,
            'name' => 'Test Client',
            'secret' => 'test-secret',
            'redirect' => 'http://localhost/callback',
            'personal_access_client' => false,
            'password_client' => false,
            'revoked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('oauth:migrate-client-ids')
            ->expectsOutput("Client ID {$migratedId} already migrated. Skipping.")
            ->assertSuccessful();
    }
}

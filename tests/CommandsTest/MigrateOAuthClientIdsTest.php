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
        $this->assertEquals(36, strlen($client->id));
        $this->assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $client->id);
    }

    public function testCommandSkipsAlreadyMigratedClients()
    {
        $migratedId = 'b1d72203-d142-4d7e-929a-aae9c27b2c7b';

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

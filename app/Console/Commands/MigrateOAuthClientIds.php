<?php

namespace App\Console\Commands;

use App\Models\OAuthClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateOAuthClientIds extends Command
{
    protected $signature = 'oauth:migrate-client-ids';

    protected $description = 'Migrate existing OAuth client IDs from auto-increment to secure random IDs';

    public function handle(): int
    {
        $this->info('Starting OAuth client ID migration...');

        $clients = DB::table('oauth_clients')->get();

        if ($clients->isEmpty()) {
            $this->info('No OAuth clients found. Nothing to migrate.');

            return self::SUCCESS;
        }

        $this->info("Found {$clients->count()} OAuth client(s) to migrate.");

        $idMapping = [];

        DB::beginTransaction();

        try {
            foreach ($clients as $client) {
                $oldId = $client->id;

                if (str_starts_with($oldId, 'client_')) {
                    $this->info("Client ID {$oldId} already migrated. Skipping.");

                    continue;
                }

                $newId = OAuthClient::generateSecureClientId();
                $idMapping[$oldId] = $newId;

                $this->info("Migrating client ID: {$oldId} -> {$newId}");

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

            DB::commit();

            $this->info('OAuth client ID migration completed successfully!');
            $this->newLine();
            $this->info('ID Mapping Summary:');
            foreach ($idMapping as $oldId => $newId) {
                $this->line("  {$oldId} -> {$newId}");
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            DB::rollBack();

            $this->error('Migration failed: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}

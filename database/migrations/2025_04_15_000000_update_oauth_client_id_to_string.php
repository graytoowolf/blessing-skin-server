<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    protected function getTableName(string $table): string
    {
        return config('database.connections.'.config('database.default').'.prefix', '').$table;
    }

    public function up(): void
    {
        if (!Schema::hasTable('oauth_clients')) {
            return;
        }

        $hasId = Schema::hasColumn('oauth_clients', 'id');
        $hasNewId = Schema::hasColumn('oauth_clients', 'new_id');

        if ($hasNewId && !$hasId) {
            $this->finishMigration();
            return;
        }

        if (!$hasId && !$hasNewId) {
            return;
        }

        $this->cleanupFailedMigration();

        if (!$hasNewId) {
            Schema::table('oauth_clients', function (Blueprint $table) {
                $table->string('new_id', 36)->nullable()->after('id');
            });
        }

        if (!Schema::hasColumn('oauth_access_tokens', 'new_client_id')) {
            Schema::table('oauth_access_tokens', function (Blueprint $table) {
                $table->string('new_client_id', 36)->nullable()->after('client_id');
            });
        }

        if (!Schema::hasColumn('oauth_auth_codes', 'new_client_id')) {
            Schema::table('oauth_auth_codes', function (Blueprint $table) {
                $table->string('new_client_id', 36)->nullable()->after('client_id');
            });
        }

        if (!Schema::hasColumn('oauth_personal_access_clients', 'new_client_id')) {
            Schema::table('oauth_personal_access_clients', function (Blueprint $table) {
                $table->string('new_client_id', 36)->nullable()->after('client_id');
            });
        }

        $clients = DB::table('oauth_clients')
            ->whereNull('new_id')
            ->orWhere('new_id', '')
            ->get();

        foreach ($clients as $client) {
            $oldId = $client->id;

            if ($this->isValidUuid((string) $oldId)) {
                $newId = $oldId;
            } else {
                $newId = $this->generateSecureClientId();
            }

            DB::table('oauth_clients')
                ->where('id', $oldId)
                ->update(['new_id' => $newId]);

            DB::table('oauth_access_tokens')
                ->where('client_id', $oldId)
                ->update(['new_client_id' => $newId]);

            DB::table('oauth_auth_codes')
                ->where('client_id', $oldId)
                ->update(['new_client_id' => $newId]);

            DB::table('oauth_personal_access_clients')
                ->where('client_id', $oldId)
                ->update(['new_client_id' => $newId]);
        }

        $tableName = $this->getTableName('oauth_clients');
        DB::statement("ALTER TABLE {$tableName} MODIFY id BIGINT UNSIGNED NOT NULL");
        DB::statement("ALTER TABLE {$tableName} MODIFY new_id VARCHAR(36) NOT NULL");

        Schema::table('oauth_clients', function (Blueprint $table) {
            $table->dropPrimary('id');
            $table->dropColumn('id');
            $table->primary('new_id');
            $table->renameColumn('new_id', 'id');
        });

        $this->finishRelatedTables();
    }

    protected function finishMigration(): void
    {
        $tableName = $this->getTableName('oauth_clients');

        $indexExists = DB::selectOne("
            SELECT COUNT(*) as count
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = ?
            AND index_name = 'PRIMARY'
        ", [$tableName]);

        if ($indexExists && $indexExists->count > 0) {
            $pkColumn = DB::selectOne("
                SELECT column_name
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                AND table_name = ?
                AND index_name = 'PRIMARY'
            ", [$tableName]);

            if ($pkColumn && $pkColumn->column_name === 'new_id') {
                DB::statement("ALTER TABLE {$tableName} MODIFY new_id VARCHAR(36) NOT NULL");
                Schema::table('oauth_clients', function (Blueprint $table) {
                    $table->renameColumn('new_id', 'id');
                });
            }
        } else {
            DB::statement("ALTER TABLE {$tableName} MODIFY new_id VARCHAR(36) NOT NULL");
            Schema::table('oauth_clients', function (Blueprint $table) {
                $table->primary('new_id');
                $table->renameColumn('new_id', 'id');
            });
        }

        $this->finishRelatedTables();
    }

    protected function finishRelatedTables(): void
    {
        if (Schema::hasColumn('oauth_access_tokens', 'new_client_id')) {
            Schema::table('oauth_access_tokens', function (Blueprint $table) {
                if (Schema::hasColumn('oauth_access_tokens', 'client_id')) {
                    $table->dropColumn('client_id');
                }
                $table->renameColumn('new_client_id', 'client_id');
            });
        }

        if (Schema::hasColumn('oauth_auth_codes', 'new_client_id')) {
            Schema::table('oauth_auth_codes', function (Blueprint $table) {
                if (Schema::hasColumn('oauth_auth_codes', 'client_id')) {
                    $table->dropColumn('client_id');
                }
                $table->renameColumn('new_client_id', 'client_id');
            });
        }

        if (Schema::hasColumn('oauth_personal_access_clients', 'new_client_id')) {
            Schema::table('oauth_personal_access_clients', function (Blueprint $table) {
                if (Schema::hasColumn('oauth_personal_access_clients', 'client_id')) {
                    $table->dropColumn('client_id');
                }
                $table->renameColumn('new_client_id', 'client_id');
            });
        }
    }

    protected function cleanupFailedMigration(): void
    {
        if (Schema::hasColumn('oauth_clients', 'new_id') && Schema::hasColumn('oauth_clients', 'id')) {
            $client = DB::table('oauth_clients')->first();
            if ($client && !$this->isValidUuid((string) $client->id)) {
                DB::table('oauth_clients')->whereNotNull('new_id')->update(['new_id' => null]);
            }
        }

        if (Schema::hasColumn('oauth_access_tokens', 'new_client_id')) {
            DB::table('oauth_access_tokens')->whereNotNull('new_client_id')->update(['new_client_id' => null]);
        }

        if (Schema::hasColumn('oauth_auth_codes', 'new_client_id')) {
            DB::table('oauth_auth_codes')->whereNotNull('new_client_id')->update(['new_client_id' => null]);
        }

        if (Schema::hasColumn('oauth_personal_access_clients', 'new_client_id')) {
            DB::table('oauth_personal_access_clients')->whereNotNull('new_client_id')->update(['new_client_id' => null]);
        }
    }

    protected function isValidUuid(string $id): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id) === 1;
    }

    protected function generateSecureClientId(): string
    {
        do {
            $id = (string) Str::uuid();
        } while (DB::table('oauth_clients')->where('new_id', $id)->exists());

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

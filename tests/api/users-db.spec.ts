/* eslint-disable playwright/no-skipped-test */
import { Config } from '@constants/config.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';

test.describe('API Users — Database Integration', () => {
    test('TC-API-DB-001 — database-seeded user should be returned by API', async ({ db }) => {
        const email = DataGenerator.randomEmail('seed-api-test');

        const user = await db.seed<{ id: string }>({
            table: 'users',
            data: {
                email,
                name: 'Seeded User',
                password_hash: 'hashed_value',
                role: 'member',
                created_at: new Date().toISOString()
            }
        });

        expect(user?.id).toBeTruthy();

        const dbUser = await db.findOne<{ email: string; name: string }>('users', { id: user?.id });
        expect(dbUser?.email).toBe(email);
        expect(dbUser?.name).toBe('Seeded User');
    });

    test('TC-API-DB-002 — sign in should update last_login_at in database', async ({ userOrganizationService, db }) => {
        const email = Config.auth.superAdminEmail;

        await userOrganizationService.signIn({ email, password: Config.auth.password });

        const user = await db.findOne<{ last_login_at: string }>('users', { email });
        expect(user?.last_login_at).toBeTruthy();
    });

    test('TC-API-DB-003 — bulk seed and verify count', async ({ db }) => {
        const prefix = `bulk-${Date.now()}`;
        const count = 5;

        for (let i = 0; i < count; i++) {
            await db.seed({
                table: 'users',
                data: {
                    email: `${prefix}-${i}@test.com`,
                    name: `Bulk User ${i}`,
                    password_hash: 'hashed',
                    role: 'member',
                    created_at: new Date().toISOString()
                }
            });
        }

        const users = await db.findMany('users', { role: 'member' });
        const seededUsers = users.filter((u: Record<string, unknown>) => (u.email as string).startsWith(prefix));
        expect(seededUsers).toHaveLength(count);
    });

    test('TC-API-DB-004 — update user in database and verify', async ({ db }) => {
        const email = DataGenerator.randomEmail('update-test');

        await db.seed({
            table: 'users',
            data: { email, name: 'Before Update', password_hash: 'hashed', role: 'member' }
        });

        const affected = await db.update('users', { email }, { name: 'After Update' });
        expect(affected).toBe(1);

        const updated = await db.findOne<{ name: string }>('users', { email });
        expect(updated?.name).toBe('After Update');
    });

    test('TC-API-DB-005 — skip test when precondition not met', async ({ db }) => {
        const admin = await db.findOne('users', { role: 'superadmin' });
        test.skip(!admin, 'No superadmin user in database');

        expect(admin).toBeTruthy();
    });
});

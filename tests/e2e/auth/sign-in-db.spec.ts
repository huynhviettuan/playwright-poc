import { BrowserInstance } from '@common/browser';
import { Endpoints } from '@constants/endpoints.constant';
import { NotificationMessages } from '@constants/messages.constant';
import { expect, test } from '@fixtures/fixtures';
import { DataGenerator } from '@helpers/generate-data-functions';

test.describe('Sign In — Database Verification', () => {
    test.beforeEach(async ({ goto }) => {
        await goto(Endpoints.auth.signIn);
    });

    test('TC-SI-DB-001 — should create login audit record on successful sign in', async ({ signInPage, db }) => {
        const email = DataGenerator.randomEmail('audit-test');

        await db.seed({
            table: 'users',
            data: { email, password_hash: 'hashed_password', name: 'Audit Test User', role: 'member' }
        });

        await signInPage.signIn(email);
        await expect(BrowserInstance.currentPage).not.toHaveURL(new RegExp(Endpoints.auth.signIn));

        const auditLog = await db.findOne('audit_logs', { user_email: email, action: 'login' });
        expect(auditLog).not.toBeNull();
    });

    test('TC-SI-DB-002 — should lock account after failed login attempts', async ({ signInPage, db, notification }) => {
        const email = DataGenerator.randomEmail('lockout-test');

        await db.seed({
            table: 'users',
            data: { email, password_hash: 'hashed_password', name: 'Lockout User', role: 'member', failed_attempts: 0 }
        });

        for (let i = 0; i < 5; i++) {
            await signInPage.signIn(email, 'WrongPassword!');
            expect(await notification.getMessage()).toContain(NotificationMessages.auth.loginFailed);
        }

        const user = await db.findOne<{ failed_attempts: number; locked: boolean }>('users', { email });
        expect(user?.failed_attempts).toBe(5);
        expect(user?.locked).toBe(true);
    });

    test('TC-SI-DB-003 — should verify user role from database matches UI permissions', async ({ signInPage, db }) => {
        const email = DataGenerator.randomEmail('role-test');

        await db.seed({
            table: 'users',
            data: { email, password_hash: 'hashed_password', name: 'Admin User', role: 'admin' }
        });

        await signInPage.signIn(email);
        await expect(BrowserInstance.currentPage).not.toHaveURL(new RegExp(Endpoints.auth.signIn));

        const user = await db.findOne<{ role: string }>('users', { email });
        expect(user?.role).toBe('admin');
    });
});

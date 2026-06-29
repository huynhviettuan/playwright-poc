import { type User } from '@models/test-data/test-data.interface';

import testData from '../../data/test-data/users.json';
import { BaseTestDataHelper } from './base-test-data.helper';

export class UserDataHelper extends BaseTestDataHelper<User> {
    constructor() {
        super(testData.users);
    }

    getByRole(role: string): User {
        const user = this.findBy('role', role);
        if (!user) throw new Error(`No user with role "${role}"`);
        return user;
    }

    getByEmail(email: string): User {
        const user = this.findBy('email', email);
        if (!user) throw new Error(`No user with email "${email}"`);
        return user;
    }

    getActive(): User[] {
        return this.filterBy('status', 'active');
    }

    getAdmin(): User {
        return this.getByRole('admin');
    }

    getRegularUser(): User {
        return this.getByRole('user');
    }
}

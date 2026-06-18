import testUsers from '@data/test-users.json';

interface User {
    id: string;
    email: string;
    password: string;
    role: string;
    name: string;
    status: string;
}

export class TestDataHelper {
    static getUsers(): User[] {
        return testUsers.users;
    }

    static getUserByRole(role: string): User | undefined {
        return testUsers.users.find(user => user.role === role);
    }

    static getUserByEmail(email: string): User | undefined {
        return testUsers.users.find(user => user.email === email);
    }

    static getActiveUsers(): User[] {
        return testUsers.users.filter(user => user.status === 'active');
    }

    static getAdminUser(): User {
        return testUsers.users.find(user => user.role === 'admin');
    }

    static getRegularUser(): User {
        return testUsers.users.find(user => user.role === 'user');
    }
}

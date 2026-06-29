export interface Identifiable {
    id: string;
}

export interface User extends Identifiable {
    email: string;
    password: string;
    role: string;
    name: string;
    status: string;
}

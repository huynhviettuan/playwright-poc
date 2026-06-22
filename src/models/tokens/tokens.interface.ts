export type CreateTokenRequest = {
    name: string;
};

export type Token = {
    id: string;
    name?: string;
    token?: string;
    createdAt?: string;
};

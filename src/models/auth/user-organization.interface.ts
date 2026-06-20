export type SignInRequest = {
    email: string;
    password: string;
};

export type SignInResponse = {
    token: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: { id: string; email: string };
};

export type ForgetPasswordRequest = {
    email: string;
};

export type ResetPasswordRequest = {
    token: string;
    password: string;
};

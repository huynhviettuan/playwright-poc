export const Endpoints = {
    auth: {
        signIn: '/sign-in',
        signOut: '/sign-out',
        register: '/register',
        forgotPassword: '/forgot-password'
    },
    api: {
        users: '/api/users',
        tokens: '/api/tokens'
    }
} as const;

export const ENDPOINTS = {
    SIGN_IN: Endpoints.auth.signIn
};

export const Endpoints = {
    auth: {
        signIn: '/sign-in',
        signOut: '/sign-out',
        register: '/register',
        forgotPassword: '/forgot-password',
        resetPassword: '/reset-password'
    },
    api: {
        users: '/api/users',
        tokens: '/api/tokens'
    }
} as const;

export const ApiEndpoints = {
    userOrganization: {
        signIn: '/user-organization/auth/signin',
        signOut: '/user-organization/auth/logout',
        forgetPassword: '/user-organization/auth/forget-password',
        resetPassword: '/user-organization/auth/reset-password',
        signUpInvitation: '/user-organization/auth/signup-invitation'
    },
    users: {
        me: '/user-organization/users/me',
        profiles: '/user-organization/users/profiles'
    }
} as const;

/**
 * Legacy uppercase constant — keep until callers migrate to `Endpoints`.
 */
export const ENDPOINTS = {
    SIGN_IN: Endpoints.auth.signIn
};

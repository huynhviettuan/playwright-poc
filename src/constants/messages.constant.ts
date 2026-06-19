export const NotificationMessages = {
    // Authentication
    auth: {
        loginSuccess: 'Login successful',
        loginFailed: 'Invalid credentials',
        logoutSuccess: 'Logout successful',
        sessionExpired: 'Your session has expired',
        passwordChanged: 'Password changed successfully',
        passwordResetSent: 'Password reset email sent'
    },

    // User Management
    user: {
        created: 'User created successfully',
        updated: 'User updated successfully',
        deleted: 'User deleted successfully',
        notFound: 'User not found',
        duplicateEmail: 'Email already exists'
    },

    // Payment
    payment: {
        success: 'Payment successful',
        failed: 'Payment failed',
        pending: 'Payment is being processed',
        cancelled: 'Payment cancelled',
        refunded: 'Payment refunded'
    },

    // Form Validation
    validation: {
        required: 'This field is required',
        invalidEmail: 'Invalid email format',
        invalidPhone: 'Invalid phone number',
        passwordTooShort: 'Password must be at least 8 characters',
        passwordsNotMatch: 'Passwords do not match'
    },

    // General
    general: {
        saveSuccess: 'Changes saved successfully',
        saveFailed: 'Failed to save changes',
        deleteConfirm: 'Are you sure you want to delete?',
        networkError: 'Network error. Please try again',
        serverError: 'Server error. Please contact support'
    }
} as const;

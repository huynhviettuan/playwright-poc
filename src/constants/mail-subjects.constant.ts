export const MailSubjects = {
    auth: {
        welcome: 'Welcome to Our Platform',
        verifyEmail: 'Verify your email',
        resetPassword: 'Reset your password',
        passwordChanged: 'Your password has been changed',
        accountLocked: 'Your account has been locked'
    },

    user: {
        invitation: 'You have been invited',
        accountCreated: 'Your account has been created',
        profileUpdated: 'Your profile has been updated'
    },

    payment: {
        receipt: 'Payment receipt',
        failed: 'Payment failed',
        refunded: 'Payment refunded',
        subscriptionRenewed: 'Subscription renewed'
    },

    notification: {
        reminder: 'Reminder',
        alert: 'Important alert',
        announcement: 'Announcement'
    }
} as const;

import {
    ForgetPasswordRequest,
    ResetPasswordRequest,
    SignInRequest
} from '@models/auth/user-organization.interface';
import { BaseService } from '@services/base.service';

export class UserOrganizationService extends BaseService {
    constructor() {
        super('/user-organization/auth');
    }

    async signIn(body: SignInRequest) {
        return await this.post({
            url: this.createEndpoint('/signin'),
            body
        });
    }

    async logout(token: string) {
        return await this.post({
            token,
            url: this.createEndpoint('/logout')
        });
    }

    async forgetPassword(body: ForgetPasswordRequest) {
        return await this.post({
            url: this.createEndpoint('/forget-password'),
            body
        });
    }

    async resetPassword(body: ResetPasswordRequest) {
        return await this.post({
            url: this.createEndpoint('/reset-password'),
            body
        });
    }
}

import {
    type ForgetPasswordRequest,
    type ResetPasswordRequest,
    type SignInRequest,
    type SignInResponse
} from '@models/auth/user-organization.interface';
import { type ServiceResponse } from '@models/requests/request.type';
import { BaseService } from '@services/base.service';

class AuthService extends BaseService {
    constructor(parent: BaseService) {
        super('/auth', parent);
    }

    async signIn(body: SignInRequest): Promise<ServiceResponse<SignInResponse>> {
        return await this.send<SignInResponse>('post', {
            url: this.endpoint('/signin'),
            body
        });
    }

    async logout(): Promise<ServiceResponse<void>> {
        return await this.send<void>('post', {
            url: this.endpoint('/logout')
        });
    }

    async forgetPassword(body: ForgetPasswordRequest): Promise<ServiceResponse<void>> {
        return await this.send<void>('post', {
            url: this.endpoint('/forget-password'),
            body
        });
    }

    async resetPassword(body: ResetPasswordRequest): Promise<ServiceResponse<void>> {
        return await this.send<void>('post', {
            url: this.endpoint('/reset-password'),
            body
        });
    }
}

export class UserOrganizationService extends BaseService {
    readonly auth = new AuthService(this);

    constructor() {
        super('/user-organization');
    }
}

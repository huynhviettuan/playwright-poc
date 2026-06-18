import { BaseService } from '@services/base.service';

export class AuthenticationService extends BaseService {
    constructor() {
        super('/auth');
    }

    async postLogin(body: { email: string; password: string }) {
        return await this.post({
            url: this.createEndpoint('/login'),
            body
        });
    }

    async deleteLogout(token: string) {
        return await this.delete({
            token,
            url: this.createEndpoint('/logout')
        });
    }
}

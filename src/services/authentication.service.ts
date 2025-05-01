import { generateQueryParamsPath } from '@helpers/helper-functions';
import { BaseService } from '@services/base.service';

export class AuthenticationService extends BaseService {
    constructor() {
        super('/auth');
    }

    async getStatus(
        token: string,
        queryParams = {
            email: ''
        }
    ) {
        return await this.get({
            token,
            url: this.createEndpoint(`/status${generateQueryParamsPath(queryParams)}`)
        });
    }

    async postLogin(body: { email: string; password: string }) {
        return await this.post({
            url: this.createEndpoint('/login'),
            body
        });
    }

    async postRefreshToken(
        token: string,
        body: {
            refreshToken: string;
        }
    ) {
        return await this.post({
            token,
            url: this.createEndpoint('/refresh-token'),
            body
        });
    }

    async postLumenProxyLogin(
        token: string,
        body: {
            email: string;
        }
    ) {
        return await this.post({
            token,
            url: this.createEndpoint('/lumen-proxy-login'),
            body
        });
    }

    async postShortToken(token: string) {
        return await this.post({
            token,
            url: this.createEndpoint('/short-token')
        });
    }

    async postValidatePassword(
        token: string,
        body: {
            email: string;
            password: string;
        }
    ) {
        return await this.post({
            token,
            url: this.createEndpoint('/validate-password'),
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

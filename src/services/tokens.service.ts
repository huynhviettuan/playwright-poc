import { BaseService } from '@services/base.service';

export class TokensService extends BaseService {
    constructor() {
        super('/tokens');
    }

    async getTokens(token: string) {
        return await this.get({
            token
        });
    }

    async postTokens(
        token: string,
        body: {
            name: string;
        }
    ) {
        return await this.post({
            token,
            body
        });
    }

    async deleteTokens(token: string, id: string) {
        return await this.delete({
            token,
            id
        });
    }
}

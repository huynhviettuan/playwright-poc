import { type ServiceResponse } from '@models/requests/request.type';
import { type CreateTokenRequest, type Token } from '@models/tokens/tokens.interface';
import { BaseService } from '@services/base.service';

export class TokensService extends BaseService {
    constructor() {
        super('/tokens');
    }

    async getAll(): Promise<ServiceResponse<Token[]>> {
        return await this.send<Token[]>('get');
    }

    async create(body: CreateTokenRequest): Promise<ServiceResponse<Token>> {
        return await this.send<Token>('post', { body });
    }

    async deleteById(id: string): Promise<ServiceResponse<void>> {
        return await this.send<void>('delete', { id });
    }
}

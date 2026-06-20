import { PASSWORD } from '@constants/config.constant';
import { ResponseHelper } from '@helpers/helper-functions';
import { SignInResponse } from '@models/auth/user-organization.interface';
import { UserOrganizationService } from '@services/user-organization.service';

export class ApiCommands {
    private readonly userOrganizationService: UserOrganizationService;

    constructor() {
        this.userOrganizationService = new UserOrganizationService();
    }

    async getAuthorizationToken(email: string, password: string = PASSWORD): Promise<string> {
        const response = await this.userOrganizationService.signIn({ email, password });
        const body = await ResponseHelper.toJson<SignInResponse>(response);
        return body.token;
    }
}

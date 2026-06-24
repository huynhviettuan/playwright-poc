import { PASSWORD } from '@constants/config.constant';
import { UserOrganizationService } from '@services/user-organization.service';

export class ApiCommands {
    private readonly userOrganizationService: UserOrganizationService;

    constructor() {
        this.userOrganizationService = new UserOrganizationService();
    }

    async getAuthorizationToken(email: string, password: string = PASSWORD): Promise<string> {
        const { data } = await this.userOrganizationService.auth.signIn({ email, password });
        return data.token;
    }
}

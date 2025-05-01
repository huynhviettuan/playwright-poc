import { PASSWORD } from '@constants/config.constant';
import { fetchJsonResponse } from '@helpers/helper-functions';
import { AuthenticationService } from '@services/authentication.service';

export class ApiCommands {
    authenticationService: AuthenticationService;

    constructor() {
        this.authenticationService = new AuthenticationService();
    }

    async getAuthorizationToken(email: string): Promise<string> {
        return (
            await fetchJsonResponse<{ token: string }>(
                await this.authenticationService.postLogin({
                    email,
                    password: PASSWORD
                })
            )
        ).token;
    }
}

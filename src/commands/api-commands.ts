import { PASSWORD } from '@constants/config.constant';
import { ResponseHelper } from '@helpers/helper-functions';
import { AuthenticationService } from '@services/authentication.service';

export class ApiCommands {
    authenticationService: AuthenticationService;

    constructor() {
        this.authenticationService = new AuthenticationService();
    }

    async getAuthorizationToken(email: string): Promise<string> {
        return (
            await ResponseHelper.toJson<{ token: string }>(
                await this.authenticationService.postLogin({
                    email,
                    password: PASSWORD
                })
            )
        ).token;
    }
}

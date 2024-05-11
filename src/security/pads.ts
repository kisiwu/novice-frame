/**
 * security/pads
 */

import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils';
import { IRouter, RequestHandler } from '@novice1/routing';

export interface ISecurityPad {
    getRouter?(): IRouter
    getScheme(): BaseAuthUtil
    getAuthHandlers(): RequestHandler[]
}

export abstract class OAuth2Pad implements ISecurityPad {

    protected authHandlers: RequestHandler[] = []

    protected securitySchemeName: string
    protected description?: string
    protected scopes?: Record<string, string>

    constructor(
        securitySchemeName: string
    ) {
        this.securitySchemeName = securitySchemeName
    }

    setDescription(description: string): this {
        this.description = description;
        return this;
    }

    /**
     * 
     * @param scopes The scopes of the access request.
     * A map between the scope name and a short description for it. The map MAY be empty.
     * @returns 
     */
    setScopes(scopes: Record<string, string>): this {
        this.scopes = scopes;
        return this;
    }

    setAuthHandlers(...handler: RequestHandler[]): this {
        this.authHandlers = handler
        return this;
    }

    getScopes(): Record<string, string> | undefined {
        return this.scopes
    }

    getSecuritySchemeName(): string {
        return this.securitySchemeName;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    getAuthHandlers(): RequestHandler[] {
        return this.authHandlers
    }

    abstract getRouter(): IRouter

    abstract getScheme(): BaseAuthUtil

}
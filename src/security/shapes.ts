/**
 * security/shapes
 */

import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils';
import { IRouter, RequestHandler } from '@novice1/routing';

export interface ISecurityShape {
    router?(): IRouter
    scheme(): BaseAuthUtil
    authHandlers(): RequestHandler[]
}

export abstract class OAuth2Shape implements ISecurityShape {

    protected _authHandlers: RequestHandler[] = []

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
        this._authHandlers = handler
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

    authHandlers(): RequestHandler[] {
        return this._authHandlers
    }

    abstract router(): IRouter

    abstract scheme(): BaseAuthUtil

}
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils';
import { IRouter } from '@novice1/routing';

export interface ISecurityBuilder {
    build(): IRouter
    buildDoc(): BaseAuthUtil
}

export abstract class OAuth2Builder implements ISecurityBuilder {
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

    getScopes(): Record<string, string> | undefined {
        return this.scopes
    }

    getSecuritySchemeName(): string {
        return this.securitySchemeName;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    abstract build(): IRouter

    abstract buildDoc(): BaseAuthUtil

}
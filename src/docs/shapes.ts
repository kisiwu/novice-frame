import { LicenseObject, ServerObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions'
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils'

export interface DocsLogo {
    url: string
    alt?: string
}

export interface DocsOptions {
    logo?: DocsLogo,
    tagGroups?: Record<string, string[]>
}

export interface DocsConfig {
    path?: string
    title?: string
    consumes?: string[]
    security?: BaseAuthUtil
    license?: LicenseObject | string
    host?: ServerObject
    options?: DocsOptions
}

export interface IDocsShape {
    docs(): DocsConfig
}
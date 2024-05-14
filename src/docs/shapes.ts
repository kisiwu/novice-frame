import { LicenseObject, ServerObject, ServerVariableObject } from '@novice1/api-doc-generator/lib/generators/openapi/definitions'
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

export class DocsShape implements IDocsShape {
    #path?: string
    #title?: string
    #consumes?: string[]
    #license?: LicenseObject
    #host?: ServerObject
    #logo?: DocsLogo
    #tagGroups?: Record<string, string[]>

    setPath(path: string): this {
        this.#path = path
        return this
    }

    setTitle(title: string): this {
        this.#title = title
        return this
    }

    setConsumes(mimeTypes: string[]): this
    setConsumes(...mimeTypes: string[]): this
    setConsumes(mimeTypes: string[] | string, ...moreMimeTypes: string[]): this {
        if (Array.isArray(mimeTypes)) {
            this.#consumes = mimeTypes
        } else if (typeof mimeTypes === 'string') {
            this.#consumes = [mimeTypes].concat(moreMimeTypes)
        }
        return this
    }

    setLicense(name: string, url?: string): this
    setLicense(license: LicenseObject): this
    setLicense(value: LicenseObject | string, url?: string): this {
        if (typeof value === 'string') {
            this.#license = { 
                name: value,
                url
            }
        } else {
            this.#license = value
        }
        return this
    }

    setLogo(url: string, alt?: string): this
    setLogo(logo: DocsLogo): this
    setLogo(value: DocsLogo | string, alt?: string): this {
        if (typeof value === 'string') {
            this.#logo = { 
                url: value,
                alt
            }
        } else {
            this.#logo = value
        }
        return this
    }

    setTagsGroup(value: Record<string, string[]>): this {
        this.#tagGroups = value
        return this
    }

    setHost(url: string, description?: string, variables?: Record<string, ServerVariableObject>): this
    setHost(server: ServerObject): this
    setHost(value: ServerObject | string, description?: string, variables?: Record<string, ServerVariableObject>): this {
        if (typeof value === 'string') {
            this.#host = { 
                url: value,
                description,
                variables
            }
        } else {
            this.#host = value
        }
        return this
    }

    docs(): DocsConfig {
        //throw new Error('Method not implemented.')
        return {
            path: this.#path,
            title: this.#title,
            consumes: this.#consumes,
            license: this.#license,
            host: this.#host,
            options: {
                logo: this.#logo,
                tagGroups: this.#tagGroups
            }
        }
    }
}

new DocsShape().setConsumes('jsnkf', 'ojsposd')
    .setLicense('kjjkf', 'ioqehjfoikjkepokzjopkepfokpêkfprevpk')
    .setLogo('oiqdoq', 'logo')
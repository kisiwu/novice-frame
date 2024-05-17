import { 
    ExampleObject, 
    LicenseObject, 
    ReferenceObject, 
    SchemaObject, 
    ServerObject, 
    ServerVariableObject 
} from '@novice1/api-doc-generator/lib/generators/openapi/definitions'
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils'
import { BaseResponseUtil } from '@novice1/api-doc-generator/lib/utils/responses/baseResponseUtils'
import { ExampleShape } from './classes/ExampleShape'
import { SchemaShape } from './classes/SchemaShape'

export * from './classes/ExampleShape'
export * from './classes/MediaTypeShape'
export * from './classes/SchemaShape'

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
    examples?: Record<string, ReferenceObject | ExampleObject>
    schemas?: Record<string, SchemaObject | ReferenceObject>
    responses?: BaseResponseUtil
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

    #examples?: Iterable<ExampleShape>
    #schemas?: Iterable<SchemaShape>
    #responses?: BaseResponseUtil

    private _getExamples(): Record<string, ReferenceObject | ExampleObject> | undefined {
        if (!this.#examples) return
        const values: Record<string, ReferenceObject | ExampleObject> = {}
        for(const v of this.#examples) {
            values[v.getName()] = v.toObject()
        }
        return values
    }
    private _getSchemas(): Record<string, SchemaObject | ReferenceObject> | undefined {
        if (!this.#schemas) return
        const values: Record<string, SchemaObject | ReferenceObject> = {}
        for(const v of this.#schemas) {
            values[v.getName()] = v.toObject()
        }
        return values
    }

    setPath(path: string): this {
        this.#path = path
        return this
    }

    setTitle(title: string): this {
        this.#title = title
        return this
    }

    setConsumes(mediaTypes: string[]): this
    setConsumes(...mediaTypes: string[]): this
    setConsumes(mediaTypes: string[] | string, ...moreMediaTypes: string[]): this {
        if (Array.isArray(mediaTypes)) {
            this.#consumes = mediaTypes
        } else if (typeof mediaTypes === 'string') {
            this.#consumes = [mediaTypes].concat(moreMediaTypes)
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

    setExamples(examples: Iterable<ExampleShape>): this {
        this.#examples = examples
        return this
    }
    setSchemas(schemas: Iterable<SchemaShape>): this {
        this.#schemas = schemas
        return this
    }
    setResponses(responses: BaseResponseUtil): this {
        this.#responses = responses
        return this
    }

    docs(): DocsConfig {
        return {
            path: this.#path,
            title: this.#title,
            consumes: this.#consumes,
            license: this.#license,
            host: this.#host,
            options: {
                logo: this.#logo,
                tagGroups: this.#tagGroups
            },

            examples: this._getExamples(),
            schemas: this._getSchemas(),
            responses: this.#responses
        }
    }
}

import { 
    ExampleObject, 
    LicenseObject, 
    ReferenceObject, 
    SchemaObject, 
    ServerObject, 
    ServerVariableObject, 
    TagObject
} from '@novice1/api-doc-generator/lib/generators/openapi/definitions'
import { Folder } from '@novice1/api-doc-generator/lib/generators/postman/definitions'
import { BaseAuthUtil } from '@novice1/api-doc-generator/lib/utils/auth/baseAuthUtils'
import { BaseResponseUtil } from '@novice1/api-doc-generator/lib/utils/responses/baseResponseUtils'
import { ExampleShape } from './classes/ExampleShape'
import { SchemaShape } from './classes/SchemaShape'
import { SwaggerUiOptions } from 'swagger-ui-express'

export * from './classes/ExampleShape'
export * from './classes/MediaTypeShape'
export * from './classes/SchemaShape'

export type DocsTag = TagObject & Omit<Folder, 'item'>

export type DocsSwaggerUIOptions = Omit<Omit<SwaggerUiOptions, 'swaggerUrl'>, 'swaggerUrls'>

export interface DocsLogo {
    url: string
    alt?: string
}

export interface DocsOptions {
    logo?: DocsLogo,
    tagGroups?: Record<string, string[]>
    swagger?: DocsSwaggerUIOptions
}

export interface DocsConfig {
    path?: string
    title?: string
    consumes?: string[]
    security?: BaseAuthUtil
    license?: LicenseObject | string
    version?: string
    host?: ServerObject
    examples?: Record<string, ReferenceObject | ExampleObject>
    schemas?: Record<string, SchemaObject | ReferenceObject>
    responses?: BaseResponseUtil
    tags?: DocsTag[]
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
    #version?: string
    #host?: ServerObject
    #tags?: DocsTag[]
    #logo?: DocsLogo
    #tagGroups?: Record<string, string[]>
    #swaggerUIOptions?: DocsSwaggerUIOptions

    #examples?: Record<string, ReferenceObject | ExampleObject>
    #schemas?: Record<string, ReferenceObject | SchemaObject>
    #responses?: BaseResponseUtil

    private _convertExampleShapes(examples: Iterable<ExampleShape>): Record<string, ReferenceObject | ExampleObject> {
        const values: Record<string, ReferenceObject | ExampleObject> = {}
        for(const v of examples) {
            values[v.getName()] = v.toObject()
        }
        return values
    }

    private _convertSchemaShapes(schemas: Iterable<SchemaShape>): Record<string, ReferenceObject | SchemaObject> {
        const values: Record<string, ReferenceObject | SchemaObject> = {}
        for(const v of schemas) {
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

    setSwaggerUIOptions(value: DocsSwaggerUIOptions): this {
        this.#swaggerUIOptions = value
        return this
    }

    setVersion(version: string): this {
        this.#version = version
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

    setTags(tags: DocsTag[]): this {
        this.#tags = tags
        return this
    }

    setExamples(examples: Iterable<ExampleShape>): this
    setExamples(examples: Record<string, ReferenceObject | ExampleObject>): this
    setExamples(examples: Iterable<ExampleShape> | Record<string, ReferenceObject | ExampleObject>): this {
        if (Symbol.iterator in examples) {
            this.#examples = this._convertExampleShapes(examples)
        } else {
            this.#examples = examples
        }
        return this
    }

    setSchemas(schemas: Iterable<SchemaShape>): this
    setSchemas(schemas: Record<string, ReferenceObject | SchemaObject>): this
    setSchemas(schemas: Iterable<SchemaShape> | Record<string, ReferenceObject | SchemaObject>): this {
        if (Symbol.iterator in schemas) {
            this.#schemas = this._convertSchemaShapes(schemas)
        } else {
            this.#schemas = schemas
        }
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
            version: this.#version,
            host: this.#host,
            tags: this.#tags,
            options: {
                logo: this.#logo,
                tagGroups: this.#tagGroups,
                swagger: this.#swaggerUIOptions
            },

            examples: this.#examples,
            schemas: this.#schemas,
            responses: this.#responses
        }
    }
}

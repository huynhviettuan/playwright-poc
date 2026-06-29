import { expect } from '@fixtures/expect-fixtures';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs/promises';
import { createSchema } from 'genson-js';
import path from 'path';

import { FileWriter } from '@helpers/functions/helper-functions';

const SCHEMAS_DIR = path.join('src', 'data', 'schemas');

export async function createJsonSchema(name: string, schemaPath: string, json: object): Promise<void> {
    const dirPath = path.join(SCHEMAS_DIR, schemaPath);

    try {
        await fs.mkdir(dirPath, { recursive: true });

        const schema = createSchema(json);
        const schemaString = JSON.stringify(schema, null, 2);
        const schemaFilePath = path.join(dirPath, `${name}_schema.json`);
        await FileWriter.writeJson(schemaFilePath, schemaString);

        console.log('JSON Schema created and saved.');
    } catch (err) {
        console.error(err);
    }
}

/**
 * Validates an object against a JSON schema.
 *
 * @param fileName - The first part of the schema file name. Full name: `${fileName}_schema.json`.
 * @param filePath - The path relative to `src/data/schemas/` containing the schema file.
 * @param body - The object to validate.
 * @param shouldCreateSchema - Whether to create/overwrite the schema before validating.
 *
 * @example
 *    const body = await response.json();
 *    await validateJsonSchema("POST_booking", "booking", body);
 *    await validateJsonSchema("POST_booking", "booking", body, true);
 */
export async function validateJsonSchema(
    fileName: string,
    filePath: string,
    body: object,
    shouldCreateSchema: boolean = false
): Promise<void> {
    if (shouldCreateSchema) {
        await createJsonSchema(fileName, filePath, body);
    }

    const schemaFilePath = path.join(SCHEMAS_DIR, filePath, `${fileName}_schema.json`);
    const schemaContent = await fs.readFile(schemaFilePath, 'utf-8');
    const existingSchema: Record<string, unknown> = JSON.parse(schemaContent) as Record<string, unknown>;

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(existingSchema);
    const validRes = validate(body);

    if (!validRes) {
        const errorDetails = validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
        console.log(`SCHEMA ERRORS: ${errorDetails}\nRESPONSE BODY: ${JSON.stringify(body)}`);
    }

    expect(validRes).toBe(true);
}

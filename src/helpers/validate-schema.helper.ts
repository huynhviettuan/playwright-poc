/* eslint-disable @typescript-eslint/no-require-imports */
import { writeJsonFile } from '@helpers/helper-functions';
import { expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs/promises';
import { createSchema } from 'genson-js';

export async function createJsonSchema(name: string, path: string, json: object): Promise<void> {
    const filePath = `src/data/schemas/${path}`;

    try {
        await fs.mkdir(filePath, { recursive: true });

        const schema = createSchema(json);
        const schemaString = JSON.stringify(schema, null, 2);
        const schemaName = `src/data/schemas/${path}/${name}_schema.json`;
        await writeJsonFile(schemaName, schemaString);

        console.log('JSON Schema created and saved.');
    } catch (err) {
        console.error(err);
    }
}

/**
 * Validates an object against a JSON schema.
 *
 * @param {string} fileName - The first part of the name of the JSON schema file. The full name will be `${fileName}_schema.json`.
 * @param {string} filePath - The path to the directory containing the JSON schema file.
 * @param {object} body - The object to validate against the JSON schema.
 * @param {boolean} [createSchema=false] - Whether to create the JSON schema if it doesn't exist.
 *
 * @example
 *    const body = await response.json();
 *
 *    // This will run the assertion against the existing schema file
 *    await validateJsonSchema("POST_booking", "booking", body);
 *
 *    // This will create or overwrite the schema file
 *    await validateJsonSchema("POST_booking", "booking", body, true);
 */
export async function validateJsonSchema(
    fileName: string,
    filePath: string,
    body: object,
    createSchema: boolean = false
): Promise<void> {
    const jsonName = fileName;
    const path = filePath;

    if (createSchema) {
        await createJsonSchema(jsonName, path, body);
    }

    const existingSchema = require(`../data/schemas/${path}/${jsonName}_schema.json`);

    const ajv = new Ajv({ allErrors: false });
    addFormats(ajv);
    const validate = ajv.compile(existingSchema);
    const validRes = validate(body);

    if (!validRes) {
        console.log('SCHEMA ERRORS:', JSON.stringify(validate.errors), '\nRESPONSE BODY:', JSON.stringify(body));
    }

    expect(validRes).toBe(true);
}

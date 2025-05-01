import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: ['lib/**/*', '**/**.cjs']
    },
    ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
    {
        plugins: {
            '@typescript-eslint': typescriptEslint
        },

        languageOptions: {
            globals: {
                window: true,
                document: true,
                describe: true,
                test: true,
                expect: true,
                $: true,
                localStorage: true,
                sessionStorage: true,
                Blob: true,
                Image: true,
                process: true,
                FormData: true,
                Buffer: true,
                console: true,
                require: true,
                setTimeout: true,
                HTMLElement: true
            },

            parser: tsParser
        },

        rules: {
            '@typescript-eslint/consistent-type-imports': [0],
            '@typescript-eslint/ban-types': [0],

            quotes: [
                2,
                'single',
                {
                    avoidEscape: false,
                    allowTemplateLiterals: true
                }
            ],

            'template-curly-spacing': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            '@typescript-eslint/no-empty-function': [0],
            'no-empty-pattern': [0],
            'no-unused-vars': 'error',
            'no-var': 'error',
            'no-param-reassign': 'warn',
            'no-unreachable': 'error',
            'no-else-return': 'error',
            'no-lonely-if': 'error',
            'no-unused-labels': 'error',
            'no-undef': 'error',
            'no-self-compare': 'error',
            'valid-typeof': 'error',
            'no-duplicate-imports': 'error',
            'constructor-super': 'error',
            'no-import-assign': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-empty-object-type': 'error',
            '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'enum',
                    format: ['PascalCase']
                },
                {
                    selector: 'enumMember',
                    format: ['UPPER_CASE']
                },
                {
                    selector: ['function'],
                    modifiers: ['exported'],
                    format: ['PascalCase', 'camelCase']
                },
                {
                    selector: ['variable'],
                    modifiers: ['exported'],
                    format: ['PascalCase', 'camelCase', 'UPPER_CASE']
                }
            ]
        }
    }
];

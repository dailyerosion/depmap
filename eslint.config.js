import js from '@eslint/js';
import globals from 'globals';

export default [
    // Base configuration with JavaScript recommended rules
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.es2021,
                "ol": "readonly",
                "iemdata": "readonly",
                "google": "readonly",
                "bootstrap": "readonly",
                "describe": "readonly",
                "it": "readonly",
                "expect": "readonly",
                "vi": "readonly",
                "beforeEach": "readonly",
                "afterEach": "readonly"
            }
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
            noInlineConfig: false
        },
        rules: {
            // Error prevention
            "no-undef": "error",
            "no-unused-vars": ["warn", { 
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }],
            "prefer-const": "warn",
            "no-var": "error",

            // Best practices
            "eqeqeq": ["error", "smart"],
            "no-unused-expressions": "error",
            "no-throw-literal": "error",

            // Modern JavaScript
            "object-shorthand": "warn",
            "prefer-template": "warn",
            "prefer-arrow-callback": "warn",

            // Style (you can adjust these to your preferences)
            "indent": ["error", 4],
            "semi": ["error", "always"],
            "quotes": ["warn", "single", { "allowTemplateLiterals": true }]
        }
    },
    // Test files specific configuration
    {
        files: ["**/tests/**/*.js", "**/*.test.js"],
        rules: {
            // Relaxed rules for test files
            "no-unused-expressions": "off"
        }
    }
];

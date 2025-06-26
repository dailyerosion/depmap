const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        ignores: ["dist/**"]
    },
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions:{
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        rules: {
            "curly": ["error", "all"],
            "dot-notation": "error",
            "eqeqeq": "error",
            "id-length": ["error", { "min": 2, "exceptions": ["i", "j", "k", "x", "y", "z"] }],
            "init-declarations": ["error", "always"],
            "no-eval": "error",
            "no-var": "error",
            "prefer-const": "error",
            "semi": "error"
        }
    }
];
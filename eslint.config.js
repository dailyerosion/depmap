import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: ["tests/**", "dist/**"]
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
            "no-eval": "error",
            "no-var": "error",
            "prefer-const": "error",
            "semi": "error"
        }
    }
];
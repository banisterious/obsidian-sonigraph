import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
	{
		ignores: ["node_modules/**", "dist/**", "main.js", "*.config.js", "*.config.mjs"]
	},
	// TypeScript configuration with Obsidian plugin
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				sourceType: "module",
				ecmaVersion: 2020,
				project: "./tsconfig.json"
			}
		},
		plugins: {
			"@typescript-eslint": tseslint,
			"obsidianmd": obsidianmd
		},
		rules: {
			// TypeScript rules
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "none"
				}
			],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",

			// Obsidian PR Review Requirements
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"no-console": [
				"error",
				{
					allow: ["warn", "error"]
				}
			],

			// Obsidian plugin recommended rules
			...obsidianmd.configs.recommended
		}
	},
	// Override for logging.ts
	{
		files: ["src/logging.ts"],
		rules: {
			"no-console": "off"
		}
	}
];

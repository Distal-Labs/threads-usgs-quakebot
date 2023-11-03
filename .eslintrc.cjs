// see https://eslint.org/docs/latest/use/configure/ignore

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],
  },
  plugins: ['@typescript-eslint'],
  root: true,
  ignorePatterns: [
    '.vscode',
    '.wrangler',
    'coverage', 
    'ENV',
    'node_modules', 
    'tests',
    'jest.config.ts',
    'gists'
  ],
	rules: {
		'prefer-const': 'error',
		'no-var': 'error',
		'no-useless-escape': 'warn',
		'@typescript-eslint/no-unsafe-return': 'error',
		'@typescript-eslint/no-unused-vars': 'warn',
		// 'no-console': 'off',
		// 'no-constant-condition': 'off',
		'@typescript-eslint/require-await': 'off',
		'@typescript-eslint/no-unsafe-call': 'error',
		'@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
		'@typescript-eslint/no-extra-semi': 'warn',
		/*
			Note: the following rules have been set to off so that linting
				  can pass with the current code, but we need to gradually
				  re-enable most of them
		*/
		'@typescript-eslint/no-unsafe-assignment': 'warn',
		'@typescript-eslint/no-unsafe-argument': 'off',
		'@typescript-eslint/no-unsafe-member-access': 'warn',
		// '@typescript-eslint/restrict-plus-operands': 'off',
		'@typescript-eslint/restrict-template-expressions': 'warn',
		'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
		// '@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		// '@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		// '@typescript-eslint/no-empty-function': 'off',
		// '@typescript-eslint/ban-types': 'off',
		// '@typescript-eslint/no-empty-interface': 'off',
	},
}

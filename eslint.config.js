const { node } = require('globals')
/** @type {import("@types/eslint").Linter.FlatConfig[]} */
module.exports = [
  ...require('@abinnovision/eslint-config-base').default,
  ...require('@abinnovision/eslint-config-typescript').default,
  ...require('@abinnovision/eslint-config-react').default,
  { files: ['**/*.js'], languageOptions: { globals: node } },
  {
    ignores: ['src/libs/*'],
  },
  {
    rules: {
      indent: [
        'error',
        2,
        {
          SwitchCase: 1,
          VariableDeclarator: { var: 2, let: 2, const: 3 },
          outerIIFEBody: 1,
          FunctionDeclaration: {
            parameters: 1,
            body: 1,
          },
          FunctionExpression: {
            parameters: 1,
            body: 1,
          },
          CallExpression: {
            arguments: 1,
          },
          ArrayExpression: 1,
          ObjectExpression: 1,
          ImportDeclaration: 1,
          flatTernaryExpressions: false,
          ignoredNodes: ['TemplateLiteral *', 'JSXElement', 'JSXElement > *'],
        },
      ],

      quotes: ['error', 'single'],
      semi: ['error', 'never'],

      '@typescript-eslint/no-unused-vars': 'warn',
      'react/no-unknown-property': 'warn',
      '@typescript-eslint/consistent-type-assertions': 'warn',
      'max-nested-callbacks': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react/jsx-pascal-case': 'warn',

      'max-params': 'off',
      complexity: 'off',
      'no-void': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-unstable-nested-components': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      'import/exports-last': 'off',
      'no-template-curly-in-string': 'off',
      'guard-for-in': 'off',
      'no-case-declarations': 'off',
      'no-param-reassign': 'off',
    },
  },
]

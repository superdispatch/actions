'use strict';

module.exports = {
  overrides: [
    {
      files: '*.js',
      extends: 'plugin:@superdispatch/node',
    },

    {
      files: '*.ts',
      extends: [
        'plugin:@superdispatch/node',
        'plugin:@superdispatch/typescript',
      ],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        'node/no-missing-import': 'off',
        'node/no-extraneous-import': 'off',
        'import/no-extraneous-dependencies': 'off',
        'node/no-unsupported-features/es-syntax': [
          'error',
          { version: '>=12', ignores: ['modules'] },
        ],

        'node/no-unsupported-features/es-builtins': [
          'error',
          { version: '>=12' },
        ],

        'node/no-unsupported-features/node-builtins': [
          'error',
          { version: '>=12' },
        ],
      },
    },

    {
      files: '@types/**',
      rules: {
        '@superdispatch/directory-name': 'off',
      },
    },
  ],
};

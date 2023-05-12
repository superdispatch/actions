'use strict';

module.exports = {
  overrides: [
    {
      files: '*.js',
      extends: 'plugin:@superdispatch/node',
    },

    {
      files: '*.ts',
      extends: 'plugin:@superdispatch/ts-node',
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'node/no-unpublished-import': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
      },
    },

    {
      files: 'scripts/*',
      rules: {
        'no-console': 'off',
        'no-process-exit': 'off',
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

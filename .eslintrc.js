'use strict';

module.exports = {
  overrides: [
    {
      files: '*.js',
      extends: 'plugin:@superdispatch/node',
    },

    {
      files: '*.ts',
      extends: 'plugin:@superdispatch/typescript',
      parserOptions: {
        project: './tsconfig.json',
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

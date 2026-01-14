const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.plugins = [
        ...(webpackConfig.resolve.plugins || []),
        new TsconfigPathsPlugin({
          configFile: './tsconfig.json',
        }),
      ];
      return webpackConfig;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(axios)/)',
      ],
    },
  },
};

const path = require('path');

const groupKind = 'argoproj.io/Rollout';

const config = {
  entry: {
    extension: './src/index.tsx',
  },
  output: {
    filename: 'extensions.js',
    path: __dirname + `/dist/resources/${groupKind}/ui`,
    libraryTarget: 'window',
    library: ['extensions', 'resources', groupKind],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.ttf'],
  },
  externals: {
    react: 'React',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          allowTsInNodeModules: true,
          configFile: path.resolve('./src/tsconfig.json')
        },
      },
      {
        // prevent overriding global page styles
        test: path.resolve(__dirname, 'node_modules/argo-ui/src/components/page/page.scss'),
        use: 'null-loader',
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'raw-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'raw-loader'],
      },
    ],
  },
};

module.exports = config;
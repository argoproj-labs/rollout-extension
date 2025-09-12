const path = require('path');

const extName = "Rollout";

const config = {
  entry: {
    extension: './src/index.tsx',
  },
  output: {
    filename: `extensions-${extName}.js`,
    path: __dirname + `/dist/resources`,
    libraryTarget: "window",
    library: ["tmp", "extensions"],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.ttf'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react/jsx-runtime': 'ReactJSXRuntime',
  },
  ignoreWarnings: [
    {module: new RegExp('/node_modules/argo-ui/.*')},
    {module: new RegExp('/node_modules/argo-rollouts/.*')},
  ],
  devServer: {
    compress: false,
    historyApiFallback: {
        disableDotRule: true
    },
    port: 4040,
    host: process.env.ARGOCD_E2E_YARN_HOST || 'localhost',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          allowTsInNodeModules: true,
          transpileOnly: true,
          configFile: path.resolve('./src/tsconfig.json')
        },
      },
      {
        // prevent overriding global page styles
        test: path.resolve(__dirname, 'node_modules/argo-ui/src/components/page/page.scss'),
        use: 'null-loader',
      },
      {
        test: path.resolve(__dirname, 'node_modules/argo-ui/src/styles'),
        use: 'null-loader',
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'raw-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [__dirname],
                quietDeps: true,
                silenceDeprecations: ['import', 'legacy-js-api', 'global-builtin', 'color-functions', 'mixed-decls'],
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'raw-loader'],
      },
      // https://github.com/fkhadra/react-toastify/issues/775#issuecomment-1149569290
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto"
    },
    ],
  },
};

module.exports = config;
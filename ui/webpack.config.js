const path = require('path');

const extName = "Rollout";

const config = {
  entry: {
    extension: './src/index.tsx',
  },
  output: {
    filename: `extensions-${extName}.js`,
    path: __dirname + `/dist/resources/extension-${extName}.js`,
    libraryTarget: "window",
    library: ["tmp", "extensions"],
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
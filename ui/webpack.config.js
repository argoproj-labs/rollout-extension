const path = require("path");

const config = {
  entry: {
    extension: "./src/Extension.tsx",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
    libraryTarget: "umd",
    library: "Extension",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".ttf"],
    alias: { react: require.resolve("react") },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loaders: [
          `ts-loader?allowTsInNodeModules=true&configFile=${path.resolve(
            "./src/tsconfig.json"
          )}`,
        ],
      },
      {
        test: /\.scss$/,
        loader: "style-loader!raw-loader!sass-loader",
      },
      {
        test: /\.css$/,
        loader: "style-loader!raw-loader",
      },
    ],
  },
};

module.exports = config;

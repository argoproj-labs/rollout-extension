const path = require("path");

const config = {
  entry: {
    extension: "./src/Extension.tsx",
  },
  output: {
    filename: "extensions.js",
    path: __dirname + "/",
    libraryTarget: "window",
    library: ["extensions", "argoproj.io-Rollout"],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".ttf"],
  },
  externals: {
    react: "React", 
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

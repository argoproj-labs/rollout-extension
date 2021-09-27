const path = require("path");

const config = {
  entry: {
    extension: "./src/index.tsx",
  },
  output: {
    filename: "extensions.js",
    path: __dirname + "/dist/extension/argoproj.io/Rollout",
    libraryTarget: "window",
    library: ["extensions", "resources", "argoproj.io/Rollout"],
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
        loader: 'ts-loader',
        options: {
          allowTsInNodeModules: true,
          configFile: path.resolve("./src/tsconfig.json")
        },
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "raw-loader", "sass-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "raw-loader"],
      },
    ],
  },
};

module.exports = config;

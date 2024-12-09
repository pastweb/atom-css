const HtmlWebPackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const path = require('path');
const Dotenv = require('dotenv-webpack');
const { CssTools, cssClassLoader, cssModuleLoader } = require('../../dist/index.cjs');

const deps = require("./package.json").dependencies;

const printCompilationMessage = require('./compilation.config.js');
const { webpack } = require('webpack');

module.exports = (_, argv) => ({
  output: {
    publicPath: "http://localhost:8080/",
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      '@': './src',
    },
  },

  devServer: {
    port: 8080,
    historyApiFallback: true,
    watchFiles: [path.resolve(__dirname, 'src')],
    onListening: function (devServer) {
      const port = devServer.server.address().port

      printCompilationMessage('compiling', port)

      devServer.compiler.hooks.done.tap('OutputMessagePlugin', (stats) => {
        setImmediate(() => {
          if (stats.hasErrors()) {
            printCompilationMessage('failure', port)
          } else {
            printCompilationMessage('success', port)
          }
        })
      })
    }
  },

  resolveLoader: {
    alias: {
      '@pastweb/atom-css-webpack/css-class-loader': path.resolve(__dirname, '../../dist/cssClassLoader.cjs'),
      '@pastweb/atom-css-webpack/css-module-loader': path.resolve(__dirname, '../../dist/cssModuleLoader.cjs'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [ '@pastweb/atom-css-webpack/css-class-loader', "esbuild-loader" ],
      },
      {
        test: /\.(css|s[ac]ss)$/i,
        exclude: /\.module\.(css|s[ac]ss)$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.module\.(css|s[ac]ss)$/i,
        use: [
          "style-loader",
          '@pastweb/atom-css-webpack/css-module-loader',
          // { loader: 'css-loader', options: { modules: false } },
          "postcss-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new CssTools(),
    // new ModuleFederationPlugin({
    //   name: "react",
    //   filename: "remoteEntry.js",
    //   remotes: {},
    //   exposes: {},
    //   shared: {
    //     ...deps,
    //     react: {
    //       singleton: true,
    //       requiredVersion: deps.react,
    //     },
    //     "react-dom": {
    //       singleton: true,
    //       requiredVersion: deps["react-dom"],
    //     },
    //   },
    // }),
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      favicon: "./src/assets/favicon.ico",
    }),
    new Dotenv()
  ],
});

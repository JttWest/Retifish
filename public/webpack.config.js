const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
  entry: './js/index.jsx',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.(js|jsx)$/, exclude: /node_modules/, use: ['babel-loader'] },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, use: 'url-loader?limit=100000' }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      favicon: '' // TODO
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true
    })
    // using CDN instead
    // new webpack.ProvidePlugin({ // global import jQuery on client-side
    //   $: 'jquery',
    //   jQuery: 'jquery'
    // }
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true
  }
};

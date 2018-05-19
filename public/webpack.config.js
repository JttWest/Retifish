const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = {
  entry: ['babel-polyfill', './js/index.jsx'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      { test: /\.(js|jsx)$/, exclude: /node_modules/, use: ['babel-loader'] },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/, use: 'url-loader?limit=100000' }
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
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true
  }
}

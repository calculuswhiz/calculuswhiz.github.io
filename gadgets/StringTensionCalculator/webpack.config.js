const path = require('path');

/** @type webpack.config */
module.exports = {
  entry: {
    calculator: './src/tcalc.tsx',
    findings: './src/findings.ts'
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/, loader: 'ts-loader'
      },
      {
        test: /\.s[ac]ss$/, use: [ 'style-loader', 'css-loader', 'sass-loader' ]
      },
      {
        test: /\.md$/, type: 'asset/resource'
      }
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development'
};
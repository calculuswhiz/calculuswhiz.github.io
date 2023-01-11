const path = require('path');

module.exports = {
  entry: {
    calculator: './src/app.ts',
    findings: './src/findings.ts'
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/, loader: 'ts-loader'
      },
      {
        test: /\.s[ac]ss$/, use: [ 'style-loader', 'css-loader', 'sass-loader' ]
      }
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development'
};
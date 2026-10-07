const path = require('path');

module.exports = {
  entry: './src/app.ts',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: { 
      "util": false,
      "async_hooks": false,
      "os": false,
      "zlib": false,
      "querystring": false,
      "path": false,
      "crypto": false,
      "buffer": false
     }
  },
  mode: 'production',
};
const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');

const ASSETS_SOURCE_PATH = path.resolve('./src');
const ASSETS_BUILD_PATH = path.resolve('./build');
const ASSETS_PUBLIC_PATH = '/assets';

module.exports = {
  context: ASSETS_SOURCE_PATH,
  entry: {
    genetic: ['./apps/genetic.js'],
    nn: ['./apps/nn.js'],
    nnm: ['./apps/nnm.js'],
    random: ['./apps/random.js']
  },
  output: {
    path: ASSETS_BUILD_PATH,
    publicPath: ASSETS_PUBLIC_PATH,
    filename: './[name].js'
  },
  devServer: {
    contentBase: './public'
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude: /node_modules|screen-capture/,
        loader: 'eslint-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.png$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              mimetype: 'image/png',
              name: 'images/[name].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [new CleanWebpackPlugin([ASSETS_BUILD_PATH], { verbose: false })],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true
        }
      }
    }
  }
};

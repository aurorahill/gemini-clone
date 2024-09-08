const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const settings = {
  mode: 'development',
  entry: {
    main: './src/index.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, '../', 'build'),
    assetModuleFilename: 'images/[name][contenthash:6].[ext]',
  },
  devServer: {
    open: true,
    static: path.resolve(__dirname, '../', 'public'),
  },
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.css|scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.jpg|png|svg|gif|jpeg$/,
        type: 'asset/resource',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            ['@babel/preset-env', { useBuiltIns: 'usage', corejs: '2.0.0' }],
          ],
          plugins: ['@babel/plugin-proposal-class-properties'],
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Nowa aplikacja',
      template: 'src/templates/template.html',
    }),
  ],
};

module.exports = settings;

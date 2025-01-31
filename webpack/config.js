const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Log the resolved paths for debugging
console.log('Webpack entry:', path.resolve(__dirname, '../src/main.js'));
console.log('Webpack output path:', path.resolve(__dirname, '../dist'));
console.log('Webpack static directory:', path.resolve(__dirname, '../public'));

module.exports = {
    mode: 'development', // Fix the mode warning
    entry: path.resolve(__dirname, '../src/main.js'), // Corrected path to main.js
    output: {
        path: path.resolve(__dirname, '../dist'), // Corrected path to dist directory
        filename: '[name].bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                type: 'asset/resource'
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../index.html'),
            inject: 'body'
        }),        
        new webpack.DefinePlugin({
            'CANVAS_RENDERER': JSON.stringify(true),
            'WEBGL_RENDERER': JSON.stringify(true)
        })
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, '../public') // Corrected path to public directory
        },
        compress: true,
        port: 8080,
        hot: true
    }
};

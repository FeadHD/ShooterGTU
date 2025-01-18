/**
 * Production Webpack Configuration
 * Optimizes and bundles the game for production deployment
 * Includes minification, asset copying, and performance tuning
 */

// Required webpack plugins and utilities
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

// Phaser welcome message
const line = "---------------------------------------------------------";
const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
process.stdout.write(`${line}\n${msg}\n${line}\n`);

/**
 * Base Configuration
 * Common settings shared between development and production
 */
const base = {
    entry: "./src/main.js",      // Main entry point
    output: {
        path: path.resolve(process.cwd(), 'dist'),  // Production build directory
    },
    devtool: false,              // Disable source maps for production
    
    // Module loading rules
    module: {
        rules: [
            // JavaScript transpilation
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            // Shader loading (for Phaser WebGL)
            {
                test: [/\.vert$/, /\.frag$/],
                use: "raw-loader"
            },
            // Asset loading (images, etc.)
            {
                test: /\.(gif|png|jpe?g|svg|xml|glsl)$/i,
                use: "file-loader"
            }
        ]
    },
    
    // Webpack plugins
    plugins: [
        new CleanWebpackPlugin(),     // Clean dist before build
        
        // Configure Phaser features and renderers
        new webpack.DefinePlugin({
            // Enable core renderers
            "typeof CANVAS_RENDERER": JSON.stringify(true),
            "typeof WEBGL_RENDERER": JSON.stringify(true),
            
            // Disable debug and experimental features
            "typeof WEBGL_DEBUG": JSON.stringify(false),
            "typeof EXPERIMENTAL": JSON.stringify(false),
            
            // Disable unused plugins
            "typeof PLUGIN_3D": JSON.stringify(false),
            "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
            "typeof PLUGIN_FBINSTANT": JSON.stringify(false),
            
            // Enable sound
            "typeof FEATURE_SOUND": JSON.stringify(true)
        }),
        
        // Generate index.html
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
        
        // Copy static assets to dist
        new CopyPlugin({
            patterns: [
                { from: 'public/assets', to: 'assets' },     // Game assets
                { from: 'public/favicon.png', to: 'favicon.png' }, // Favicon
                { from: 'public/style.css', to: 'style.css' }     // Styles
            ],
        }),
    ]
};

/**
 * Production-specific configuration
 * Merges with base config to create final production build settings
 */
module.exports = merge(base, {
    mode: 'production',          // Enable production optimizations
    output: {
        filename: 'bundle.min.js'  // Minified bundle name
    },
    
    // Performance budgets
    performance: {
        maxEntrypointSize: 900000,  // Max entry point size
        maxAssetSize: 900000        // Max asset size
    },
    
    // Optimization settings
    optimization: {
        minimizer: [
            // Minify JavaScript
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false  // Remove comments
                    }
                }
            })
        ]
    }
});

/**
 * Webpack Configuration
 * Configures build process, development server, and asset handling
 * for the Phaser-based game project
 */

// Required webpack plugins and utilities
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = {
    // Development build configuration
    mode: "development",
    devtool: "eval-source-map",  // Source maps for debugging
    entry: "./src/main.js",      // Main entry point
    
    // Output configuration
    output: {
        path: path.resolve(process.cwd(), 'dist'),  // Build output directory
        filename: "[name].[fullhash].js"            // Cache-busting filenames
    },
    
    // Development server settings
    devServer: {
        hot: true,  // Enable hot module replacement
        headers: {
            // Prevent caching during development
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    },
    
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
    
    // Webpack plugins configuration
    plugins: [
        // Clean dist folder before build
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [path.join(__dirname, "dist/**/*")]
        }),
        
        // Define Phaser renderer and feature flags
        new webpack.DefinePlugin({
            // Enable WebGL and Canvas renderers
            "typeof CANVAS_RENDERER": JSON.stringify(true),
            "typeof WEBGL_RENDERER": JSON.stringify(true),
            "typeof WEBGL_DEBUG": JSON.stringify(true),
            "typeof EXPERIMENTAL": JSON.stringify(true),
            
            // Disable unused Phaser plugins
            "typeof PLUGIN_3D": JSON.stringify(false),
            "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
            "typeof PLUGIN_FBINSTANT": JSON.stringify(false),
            
            // Enable sound features
            "typeof FEATURE_SOUND": JSON.stringify(true)
        }),
        
        // Generate index.html with injected scripts
        new HtmlWebpackPlugin({
            template: "./index.html",
            inject: 'body',    // Inject scripts in body
            hash: true        // Add hash for cache busting
        }),
        
        // Enable hot module replacement
        new webpack.HotModuleReplacementPlugin()
    ]
};

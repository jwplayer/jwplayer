'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const path = require('path');

module.exports = {
    entry: {
        index: './src/index',
        'video-element-provider': './src/providers/video-element-provider.ts'
    },
    devtool: 'cheap-module-source-map',
    mode: 'development',
    node: false,
    optimization: {
        splitChunks: false
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dist')
    },
    module: {
        rules: [{
            test: /\.(?:ts|js)$/,
            exclude: /\/node_modules\//,
            use: {
                loader: 'babel-loader',
                options: {
                    babelrc: false,
                    presets: [
                        ['@babel/preset-env', { loose: true, modules: false }],
                        ['@babel/preset-typescript', {
                            onlyRemoveTypeImports: true
                        }]
                    ]
                }
            }
        }]
    }
};

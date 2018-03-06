'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const webpack = require('webpack');
const env = process.env;
const packageInfo = require('./package.json');
const flashVersion = 18;

function getBuildVersion(build) {
    // Build Version: {major.minor.revision}
    let metadata = '';
    if (env.BUILD_NUMBER) {
        const branch = env.GIT_BRANCH;
        metadata = 'opensource';
        if (branch) {
            metadata += '_' + branch.replace(/^origin\//, '').replace(/[^0-9A-Za-z-]/g, '-');
        }
        metadata += '.' + env.BUILD_NUMBER;
    } else {
        const now = new Date();
        now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
        metadata = 'local.' + now.toISOString().replace(/[.\-:T]/g, '-').replace(/Z|\.\d/g, '');
    }
    return `${build.version}+${metadata}`;
}

const compileConstants = {
    __SELF_HOSTED__: true,
    __REPO__: `''`,
    __DEBUG__: false,
    __BUILD_VERSION__: `'${getBuildVersion(packageInfo)}'`,
    __FLASH_VERSION__: flashVersion
};

const multiConfig = [
    {
        name: 'debug',
        mode: 'development',
        output: {
            path: `${__dirname}/bin-debug/`,
            filename: '[name].js',
            chunkFilename:'[name].js',
            sourceMapFilename : '[name].[hash].map',
            library: 'jwplayer',
            libraryExport: 'default',
            libraryTarget: 'window',
            pathinfo: true,
            umdNamedDefine: true
        },
        devtool: 'source-map',
        plugins: [
            new webpack.DefinePlugin(Object.assign({}, compileConstants, {
                __DEBUG__: true
            }))
        ]
    },
    {
        name: 'release',
        mode: 'production',
        output: {
            path: `${__dirname}/bin-release/`,
            filename: '[name].js',
            chunkFilename: '[name].js',
            library: 'jwplayer',
            libraryExport: 'default',
            libraryTarget: 'window',
            umdNamedDefine: true
        },
        watch: false,
        plugins: [
            new webpack.DefinePlugin(compileConstants)
        ]
    }
].map(configuration =>
    Object.assign({}, configuration, {
        entry: {
            jwplayer: './src/js/jwplayer.js'
        },
        optimization: {
            splitChunks: false
        },
        stats: {
            timings: true
        },
        resolve: {
            modules: [
                'src/js/',
                'src',
                'node_modules'
            ]
        },
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        'simple-style-loader',
                        'css-loader',
                        'postcss-loader',
                        {
                            loader: 'less-loader',
                            options: {
                                compress: true,
                                strictMath: true,
                                noIeCompat: true
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        presets: [
                            ['env']
                        ],
                        plugins: [
                            'syntax-dynamic-import',
                            'transform-object-assign'
                        ]
                    }
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-inline-loader'
                }
            ]
        }
    })
).filter(item => !!item);

module.exports = (envArgs) => {
    if (!envArgs) {
        return multiConfig;
    }

    const enabledConfig = Object.keys(envArgs).find(envName => envArgs[envName]);
    return multiConfig.find(c => c.name === enabledConfig) || multiConfig;
};


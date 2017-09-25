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

const uglifyJsOptions = {
    screwIE8: true,
    stats: true,
    mangle: {
        toplevel: true,
        eval: true,
        except: ['export', 'require']
    },
    sourceMap: true
};

const multiConfig = [
    {
        name: 'debug',
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
            new webpack.DefinePlugin(compileConstants),
            new webpack.optimize.UglifyJsPlugin(uglifyJsOptions)
        ]
    }
].map(configuration =>
    Object.assign({}, configuration, {
        entry: {
            jwplayer: './src/js/jwplayer.js'
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
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    options: {
                        babelrc: false,
                        presets: [
                            ['es2015']
                        ],
                        plugins: [
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


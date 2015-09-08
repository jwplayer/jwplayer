/* jshint node: true */

var webpack = require('webpack');
var env = process.env;

function getBuildVersion(packageInfo) {
    // Build Version: {major.minor.revision}
    var metadata = '';
    if (env.BUILD_NUMBER) {
        var branch = env.GIT_BRANCH;
        metadata = 'opensource';
        if (branch) {
            metadata += '_' + branch.replace(/^origin\//, '').replace(/[^0-9A-Za-z-]/g, '-');
        }
        metadata += '.' + env.BUILD_NUMBER;
    } else {
        var now = new Date();
        now.setTime(now.getTime()-now.getTimezoneOffset()*60000);
        metadata = 'local.' + now.toISOString().replace(/[\.\-:T]/g, '-').replace(/Z|\.\d/g, '');
    }
    return packageInfo.version +'+'+ metadata;
}

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    var packageInfo = grunt.file.readJSON('package.json');
    var buildVersion = getBuildVersion(packageInfo);
    // both flashVersion and swfTarget are needed to force flex to build using the right version
    var flashVersion = 11.2;

    var webpackCompilers = {};
    var autoprefixBrowsers = encodeURIComponent('> 1%');

    // For task testing
    // grunt.loadTasks('../grunt-flash-compiler/tasks');

    console.log('%s v%s', packageInfo.name, buildVersion);

    grunt.initConfig({
        starttime: new Date(),
        pkg: packageInfo,

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            player : [
                'src/js/**/*.js'
            ],
            tests : [
                'test/{,*/}*.js'
            ],
            grunt : [
                'Gruntfile.js'
            ]
        },

        // lints Less
        recess: {
            options: {
                // Set compile and compress to false to lint
                compile: false,
                compress: false,
                noIDs: true,
                noJSPrefix: true,
                noOverqualifying: false,
                noUnderscores: true,
                noUniversalSelectors: false,// true,
                strictPropertyOrder: false, // true,
                zeroUnits: false,
                includePaths: ['src/css', 'src/css/*']
            },
            lint: {
                files: [{
                    expand: true,
                    ext: '.css',
                    dest: 'bin-debug/skins/',
                    cwd: 'src/css/',
                    src: '{,*/}*.less'
                }]
            },
            internal: {
                options: {
                    compile: true
                },
                files: {
                    'bin-debug/reference/jwplayer.css': 'src/css/jwplayer.less'
                }
            },
            debug: {
                options: {
                    compile: true
                },
                files: [{
                    expand: true,
                    ext: '.css',
                    dest: 'bin-debug/skins/',
                    cwd: 'src/css/skins/',
                    src: '*.less'
                }]
            },
            release: {
                options: {
                    compile: true,
                    compress: true
                },
                files: [{
                    expand: true,
                    ext: '.css',
                    dest: 'bin-release/skins/',
                    cwd: 'src/css/skins/',
                    src: '*.less'
                }]
            }
        },

        watch : {
            options: {
                livereload: true
            },
            jshint: {
                files: [
                    '.jshintrc',
                    '.jshintignore'
                ],
                tasks: ['jshint']
            },
            player: {
                files : ['src/js/**/*.js'],
                tasks: ['webpack:debug', 'jshint:player', 'karma:local'],
                options: {
                    spawn: false
                }
            },
            css: {
                files: ['src/css/{,*/}*.less'],
                tasks: ['webpack:debug', 'recess:lint', 'recess:debug'],
                options: {
                    spawn: false
                }
            },
            tests: {
                files : ['test/{,*/}*.js'],
                tasks: ['jshint:tests', 'karma:local']
            },
            flash: {
                files : [
                    'src/flash/com/longtailvideo/jwplayer/{,*/}*.as',
                    'src/flash/com/wowsa/{,*/}*.as'
                ],
                tasks: ['build-flash']
            },
            grunt: {
                files: ['Gruntfile.js'],
                tasks: ['jshint:grunt']
            }
        },

        connect: {
            options: {
                port: 3000,
                // change this to '0.0.0.0' to access the server from outside
                // change this to 'localhost' to restrict access to the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: true,
                    livereload: true,
                    base: [
                        '.'
                    ]
                }
            }
        },

        webpack : {
            options: {
                entry: {
                    jwplayer : ['./src/js/jwplayer.js']
                },
                stats: {
                    timings: true
                },
                resolve: {
                    modulesDirectories: [
                        'src/js/',
                        'src'
                    ]
                },
                devtool: 'cheap-source-map',
                //devtool: 'cheap-eval-source-map',
                module: {
                    loaders: [
                        {
                            test: /\.less$/,
                            loader: 'style!css!autoprefixer?browsers=' + autoprefixBrowsers +
                                    '!less?compress'
                        },
                        {
                            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=application/font-woff'
                        },
                        {
                            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=application/octet-stream'
                        }
                    ]
                }
            },
            debug : {
                options: {
                    debug: true,
                    output: {
                        path: 'bin-debug/',
                        filename: '[name].js',
                        chunkFilename:'[name].js',
                        sourceMapFilename : '[name].[hash].map',
                        library: 'jwplayer',
                        libraryTarget: 'umd',
                        pathinfo: true
                    },
                    plugins: [
                        new webpack.DefinePlugin({
                            __DEBUG__ : true,
                            __BUILD_VERSION__: '\'' + buildVersion + '\'',
                            __FLASH_VERSION__: flashVersion
                        })
                    ]
                }
            },
            release : {
                options: {
                    output: {
                        path: 'bin-release/',
                        filename: '[name].js',
                        chunkFilename: '[name].js',
                        sourceMapFilename : '[name].[hash].map',
                        library: 'jwplayer',
                        libraryTarget: 'umd'
                    },
                    plugins: [
                        new webpack.DefinePlugin({
                            __DEBUG__ : false,
                            __BUILD_VERSION__: '\'' + buildVersion + '\'',
                            __FLASH_VERSION__: flashVersion
                        })
                    ]
                }
            }
        },
        uglify: {
            options: {
                // screwIE8: true,
                compress: {
                    warnings: true
                },
                mangle: {
                    except: ['RESERVED_KEYWORDS_TO_PROTECT']
                }
            },
            release: {
                files: {
                    'bin-release/jwplayer.js': ['bin-release/jwplayer.js']
                }
            }
        },

        flash: {
            options: {
                targetCompilerOptions : [
                    '-define+=JWPLAYER::version,\'' + packageInfo.version + '\''
                ],
                // prefer AIR_HOME for faster compilation and JRE 7 64-bit support
                sdk: env.AIR_HOME || env.FLEX_HOME,
                ascshdPort: 11123
            },
            debug : {
                options : {
                    debug : true
                },
                files : {
                    'bin-debug/jwplayer.flash.swf' : 'src/flash/com/longtailvideo/jwplayer/player/Player.as'
                }
            },
            release : {
                files : {
                    'bin-release/jwplayer.flash.swf': 'src/flash/com/longtailvideo/jwplayer/player/Player.as'
                }
            },
            library: {
                options: {
                    swc: true
                },
                files : {
                     'libs-external/jwplayer.flash.swc' : 'src/flash/com/longtailvideo/jwplayer/player/Player.as'
                }
            }
        },

        karma: {
            options: {
                configFile: './test/karma/karma.conf.js'
            },
            local : {
                coverageReporter: {
                    type : 'html',
                    dir: 'reports/coverage',
                    subdir: 'local'
                },
                jenkinsReporter: {
                    outputFile: 'reports/phantomjs/junit.xml',
                    suite: 'phantomjs',
                    classnameSuffix: 'unit'
                }
            },
            browserstack : {
                coverageReporter: {
                    type : 'html',
                    dir: 'reports/coverage',
                    subdir: 'browserStack'
                },
                jenkinsReporter: {
                    outputFile: 'reports/browserStack/junit.xml',
                    suite: 'browserStack',
                    classnameSuffix: 'unit'
                },
                browserStack: {
                    username:  process.env.BS_USERNAME,
                    accessKey: process.env.BS_AUTHKEY,
                    name: 'Unit Tests',
                    project: 'JW Player',
                    build: buildVersion,
                    timeout: 600 // 10 min
                },
                customLaunchers: require( './test/karma/browserstack-launchers' ),
                browsers: Object.keys( require( './test/karma/browserstack-launchers' ) )
            }
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        'bin-debug',
                        'bin-release'
                    ]
                }]
            }
        }
    });

    grunt.registerMultiTask('webpack', 'Spawn a webpack compiler', function() {
        var done = this.async();
        var target = this.target;
        var compiler = webpackCompilers[target];
        if (!compiler) {
            compiler = webpackCompilers[target] = webpack( this.options() );
        }
        compiler.run(function(err, stats) {
            var fail = false;
            if (err) {
                fail = true;
                grunt.log.writeln(err.toString());
            } else {
                // Fail build when errors are found
                if (stats.compilation.errors.length) {
                    fail = true;
                }
                grunt.log.writeln(stats.toString({
                    chunks: false
                }));
            }
            if (fail) {
                webpackCompilers[target] = null;
                done(false);
                return;
            }
            done();
        });
    });

    grunt.registerTask('test', [
        'karma'
    ]);

    grunt.registerTask('build-js', [
        'webpack',
        'uglify',
        'jshint:player',
        'recess'
    ]);

    grunt.registerTask('build-flash', [
        'flash:debug',
        'flash:release'
    ]);

    grunt.registerTask('build', [
        'clean',
        'build-js',
        'build-flash',
        'karma:local'
    ]);

    grunt.registerTask('serve', [
        'connect:livereload',
        'watch'
    ]);

    grunt.registerTask('default', 'build');
};

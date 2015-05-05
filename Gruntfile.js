/* jshint node: true */

var fs = require('fs');
var webpack = require('webpack');
var env = process.env;

function getBuildVersion(packageInfo) {
    // Build Version: {major.minor.revision}
    var revision = env.BUILD_NUMBER;
    if (revision === undefined) {
        var now = new Date();
        now.setTime(now.getTime()-now.getTimezoneOffset()*60000);
        revision = now.toISOString().replace(/[\.\-:Z]/g, '').replace(/T/g, '');
    }

    return packageInfo.version.replace(/\.\d*$/, '.' + revision);
}

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    var packageInfo = grunt.file.readJSON('package.json');
    var buildVersion = getBuildVersion(packageInfo);
    var flashVersion = 11.1;

    var webpackCompilers = {};
    var autoprefixBrowsers = encodeURIComponent('> 1%');

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
            lint: {
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
                files: {
                    'test/css-skins/jwplayer.css': 'src/css/jwplayer.less'
                }
            }
        },

        watch : {
            jshint: {
                files: [
                    '.jshintrc',
                    '.jshintignore'
                ],
                tasks: ['jshint']
            },
            player: {
                files : ['src/js/{,*/}*.js'],
                tasks: ['webpack:debug', 'jshint:player', 'karma:local'],
                options: {
                    spawn: false
                }
            },
            css: {
                files: ['src/css/{,*/}*.less'],
                tasks: ['webpack:debug', 'recess'],
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
                tasks: ['flash:player:debug']
            },
            grunt: {
                files: ['Gruntfile.js'],
                tasks: ['jshint:grunt']
            }
        },

        webpack : {
            options: {
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
                module: {
                    loaders: [
                        {
                            test: /\.less$/,
                            loader: 'style!css?sourceMap!autoprefixer?browsers=' + autoprefixBrowsers +
                                    '!less?sourceMap&compress'
                        },
                        {
                            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'file'
                        },
                        {
                            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=application/font-woff'
                        },
                        {
                            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=application/octet-stream'
                        },
                        {
                            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=image/svg+xml'
                        }
                    ]
                }
            },
            debug : {
                options: {
                    entry: {
                        jwplayer : './src/js/jwplayer.js'
                    },
                    output: {
                        path: 'bin-debug/',
                        filename: 'jwplayer.js',
                        library: 'jwplayer',
                        libraryTarget: 'umd',
                        pathinfo: true
                    },
                    plugins: [
                        new webpack.DefinePlugin({
                            __BUILD_VERSION__: '\'' + buildVersion + '\'',
                            __FLASH_VERSION__: flashVersion
                        })
                    ]
                }
            },
            release : {
                options: {
                    entry: {
                        jwplayer: './src/js/jwplayer.js'
                    },
                    output: {
                        path: 'bin-release/',
                        filename: 'jwplayer.js',
                        library: 'jwplayer',
                        libraryTarget: 'umd'
                    },
                    plugins: [
                        new webpack.DefinePlugin({
                            __BUILD_VERSION__: '\'' + buildVersion + '\'',
                            __FLASH_VERSION__: flashVersion
                        }),
                        new webpack.optimize.UglifyJsPlugin()
                    ]
                }
            },
            'skin-demo' : {
                options: {
                    entry: {
                        'skin-demo-styles' : './src/js/skin-demo-styles.js'
                    },
                    output: {
                        path: 'test/manual/css-skins/bin-output/',
                        filename: '[name].js'
                    }
                }
            }
        },

        flash: {
            player: {
                dest: 'jwplayer.flash.swf',
                main: 'src/flash/com/longtailvideo/jwplayer/player/Player.as'
            }
        },

        karma: {
            options: {
                configFile: './test/karma/karma.conf.js'
            },
            local : {},
            browserstack : {}
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

    grunt.registerMultiTask('flash',
            'Compile Flash SWF files. Usage `grunt flash:player:debug|release|swc:air|flex`', function() {
        var done = this.async();

        var data = this.data;

        var flags = this.flags;
        var isDebug   = !!flags.debug;
        var isLibrary = !!flags.swc;

        var flashAirOrFlexSdk = (!flags.flex && env.AIR_HOME) || env.FLEX_HOME;
        if (!flashAirOrFlexSdk) {
            grunt.fail.warn('To compile ActionScript, you must set environment '+
            'variable $AIR_HOME or $FLEX_HOME for this task to locate mxmlc.');
        }
        var isFlex = /flex/.test(flashAirOrFlexSdk);

        var command = {
            cmd: flashAirOrFlexSdk + '/bin/'+ (isLibrary ? 'compc' : 'mxmlc'),
            args: []
        };

        if (isLibrary) {
            command.args.push('-include-sources='+data.main);
        } else {
            command.args.push(data.main);
        }

        command.args.push(
            '-compiler.source-path=src/flash',
            '-compiler.library-path+=' + flashAirOrFlexSdk + '/frameworks/libs',
            '-target-player=' + flashVersion,
            '-use-network=false'
        );

        // Framework specific optimizations
        if (isFlex) {
            command.args.push(
                '-static-link-runtime-shared-libraries=true'
            );
        } else {
            command.args.push(
                '-show-multiple-definition-warnings=true',
                '-compiler.inline=true',
                '-compiler.remove-dead-code=true'
            );

            if (!isLibrary) {
                // ActionScript Compiler 2.0 Shell https://github.com/jcward/ascsh
                var ascshd = fs.existsSync(flashAirOrFlexSdk + '/bin/ascshd');
                if (ascshd) {
                    command.cmd = command.cmd.replace('bin/mxmlc', 'bin/ascshd');
                    command.args.unshift(
                        '-p', 11122 + (isDebug?100:0),
                        'mxmlc'
                    );
                }
            }
        }

        var extension = 'swf';
        var outputFolder = isDebug ? 'bin-debug' : 'bin-release';
        if (isLibrary) {
            extension = 'swc';
            outputFolder = 'libs-external';
        }
        if (isDebug) {
            command.args.push(
                '-output='     + outputFolder +'/' + data.dest.replace('swf', extension),
                '-link-report='+ outputFolder +'/' + data.dest.replace('swf', 'link.xml'),
                '-size-report='+ outputFolder +'/' + data.dest.replace('swf', 'size.xml'),
                '-strict=true',
                '-debug=true',
                '-define+=CONFIG::debugging,true',
                '-define+=CONFIG::staging,true'
            );
        } else {
            command.args.push(
                '-output='+ outputFolder +'/' + data.dest.replace('swf', extension),
                '-optimize=true',
                '-omit-trace-statements=true',
                '-warnings=false',
                '-define+=CONFIG::debugging,false',
                '-define+=CONFIG::staging,false'
            );
        }

        command.args.push(
            '-define+=JWPLAYER::version,\''+ buildVersion +'\''
        );

        // Print the mxmlc / ascshd command. Formatted to run in bash.
        grunt.log.writeln(command.cmd +' '+ command.args.join(' ').replace(/(version,'[^']*')/, '"$1"'));

        var stdout = [];
        var proc = grunt.util.spawn(command, function(error, result, code) {
            grunt.log.subhead(result.stdout);

            if (error) {
                grunt.log.error(error.message, code);
            }
            done(!error);
        });

        proc.stdout.setEncoding('utf-8');
        proc.stdout.on('data', function(data) {
            stdout.push(data);
        });

        var checkIntervalHandle = setInterval(function() {
            if (/Starting aschd server/.test(stdout.join())) {
                clearInterval(checkIntervalHandle);
                grunt.log.ok(command.cmd);

                grunt.log.subhead(stdout.join());

                done();
            }
        }, 500);
    });

    grunt.registerMultiTask('webpack', 'Spawn a webpack compiler', function() {
        var done = this.async();
        var target = this.target;
        var compiler = webpackCompilers[target];
        if (!compiler) {
            compiler = webpackCompilers[target] = webpack(this.options());
        }
        compiler.run(function(err, stats) {
            if (err) {
                webpackCompilers[target] = null;
                grunt.log.error(err.toString());
                done(false);
            } else {
                grunt.log.writeln(stats.toString({
                    chunks: false
                }));
                done();
            }
        });
    });

    grunt.registerTask('test', [
        'karma'
    ]);

    grunt.registerTask('build-js', [
        'webpack:debug',
        'webpack:release',
        'jshint:player',
        'recess'
    ]);

    grunt.registerTask('build-flash', [
        'flash:player:debug',
        'flash:player:release'
    ]);

    grunt.registerTask('build', [
        'clean',
        'build-js',
        'build-flash',
        'karma:local'
    ]);

    grunt.registerTask('default', 'build');
};

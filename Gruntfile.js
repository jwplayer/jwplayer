module.exports = function(grunt) {
    /* jshint node: true */

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        starttime: new Date(),
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ''
            },
            player: {
                src: [
                    'src/js/jwplayer.js',
                    'src/js/utils/underscore.js',
                    'src/js/utils/jwplayer.utils.js',
                    'src/js/utils/backbone.events.js',
                    'src/js/utils/jwplayer.utils.*.js',
                    'src/js/events/jwplayer.events.js',
                    'src/js/events/jwplayer.events.*.js',
                    'src/js/plugins/jwplayer.plugins.js',
                    'src/js/plugins/jwplayer.plugins.*.js',
                    'src/js/parsers/parsers.js',
                    'src/js/parsers/jwplayer.parsers.*.js',
                    'src/js/playlist/playlist.js',
                    'src/js/playlist/jwplayer.playlist.*.js',
                    'src/js/embed/embed.js',
                    'src/js/embed/jwplayer.embed.*.js',
                    'src/js/api/api.js',
                    'src/js/api/jwplayer.api.*.js',

                    'src/js/html5/jwplayer.html5.js',

                    'src/js/html5/utils/jwplayer.html5.utils.js',
                    'src/js/html5/utils/jwplayer.html5.utils.*.js',

                    'src/js/html5/parsers/jwplayer.html5.parsers.js',
                    'src/js/html5/parsers/jwplayer.html5.parsers.*.js',
                    'src/js/html5/providers/default.js',
                    'src/js/html5/providers/jwplayer.html5.video.js',
                    'src/js/html5/providers/youtube.js',
                    'src/js/html5/providers/jwplayer.provider.flash.js',
                    'src/js/html5/providers/chooseprovider.js',
                    'src/js/html5/jwplayer.html5.*.js'
                ],
                dest: 'bin-debug/jwplayer.js'
            }
        },

        replace : {
            player : {
                src: 'bin-debug/jwplayer.js',
                overwrite: true,
                replacements:[
                    {
                        from : /window.jwplayer\.version = '(.*)'/,
                        to   : 'window.jwplayer.version = \'<%= pkg.version %>\''
                    }
                ]
            }
        },

        jshint: {
            all : [
                'src/js/**/*.js',
                'Gruntfile.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        uglify : {
            options: {
                report: 'gzip',
                mangle: {
                    except: ['RESERVED_KEYWORDS_TO_PROTECT']
                }
            },
            player : {
                files: {
                    'bin-release/jwplayer.js' : 'bin-debug/jwplayer.js'
                }
            }
        },

        watch : {
            jshint: {
                files: [
                    '.jshintrc',
                    '.jshintignore'
                ],
                tasks: ['jshint:all']
            },
            player: {
                files : ['src/js/**/*.js', 'src/js/*.js'],
                tasks: ['build-js']
            },
            flash: {
                files : [
                    'src/flash/com/longtailvideo/jwplayer/{,*/}*.as',
                    'src/flash/com/wowsa/{,*/}*.as'
                ],
                tasks: ['flash:debug']
            },
            grunt: {
                files: ['.jshintrc', 'Gruntfile.js'],
                tasks: ['jshint']
            }
        },

        webpack : {
            build : {
                debug:true,
                entry: {
                    // use prefix since it has reserved values (for example plugins)
                    jwplayer : './src/js/jwplayer.js'
                },
                output: {
                    path: 'bin-debug/',
                    filename: '[name].js'
                },
                resolve: {
                    modulesDirectories: [
                        'src/js/'
                    ],
                    alias: {
                        'underscore': 'utils/underscore'
                    }
                },
                devtool: 'source-map'
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

    grunt.registerTask('flash', function(target) {
        var done = this.async();

        var flashAirOrFlexSdk = process.env.AIR_HOME || process.env.FLEX_HOME;
        if (!flashAirOrFlexSdk) {
            grunt.fail.warn('To compile ActionScript, you must set environment '+
                'variable $AIR_HOME or $FLEX_HOME for this task to locate mxmlc.');
        }
        var isDebug = target === 'debug';
        var isFlex = /flex/.test(flashAirOrFlexSdk);

        var command = {
            cmd: flashAirOrFlexSdk + '/bin/mxmlc',
            args: [
                'src/flash/com/longtailvideo/jwplayer/player/Player.as',
                '-compiler.source-path=src/flash',
                '-compiler.library-path=' + flashAirOrFlexSdk + '/frameworks/libs',
                '-default-background-color=0x000000',
                '-default-frame-rate=30',
                '-target-player=10.1.0',
                '-use-network=false'
            ]
        };

        // Framework specific optimizations
        if (isFlex) {
            command.args.push(
                '-static-link-runtime-shared-libraries=true'
            );
        } else {
            command.args.push(
               '-compiler.inline=true',
               '-compiler.remove-dead-code=true'
            );
        }

        if (isDebug) {
            command.args.push(
                '-output=bin-debug/jwplayer.flash.swf',
                '-strict=true',
                '-debug=true',
                '-define+=CONFIG::debugging,true'
            );
        } else {
            command.args.push(
                '-output=bin-release/jwplayer.flash.swf',
                '-compiler.optimize=true',
                '-compiler.omit-trace-statements=true',
                '-warnings=false',
                '-define+=CONFIG::debugging,false'
            );
        }

        // Build Version: {major.minor.revision}
        var revision = process.env.BUILD_NUMBER;
        if (revision === undefined) {
            var now = grunt.config('starttime');
            now.setTime(now.getTime()-now.getTimezoneOffset()*60000);
            revision = now.toISOString().replace(/[\.\-:Z]/g, '').replace(/T/g, '');
        }
        var buildVersion = grunt.config('pkg').version.replace(/\.\d*$/, '.' + revision);
        command.args.push(
            '-define+=JWPLAYER::version,\''+ buildVersion +'\''
        );

        grunt.log.writeln(command.cmd +' '+ command.args.join(' ').replace(/(version,'[^']*')/, '"$1"'));

        grunt.util.spawn(command, function(err, result) {
            grunt.log.subhead(result.stdout);
            if (err) {
                grunt.log.error(err.message);
            }
            done(!err);
        });
    });

    grunt.registerTask('build-js', [
        'webpack',
        'replace',
        'uglify'
    ]);

    grunt.registerTask('default', [
        'clean',
        'build-js',
        'flash:debug',
        'flash:release'
    ]);
};

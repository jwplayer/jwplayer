module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ''
            },
            shared: {
                src: [
                    'src/js/jwplayer.sourcestart.js',
                    'src/js/jwplayer.js',
                    'src/js/utils/jwplayer.utils.js',
                    'src/js/utils/jwplayer.utils.*.js',
                    'src/js/events/jwplayer.events.js',
                    'src/js/events/jwplayer.events.*.js',
                    'src/js/plugins/jwplayer.plugins.js',
                    'src/js/plugins/jwplayer.plugins.*.js',
                    'src/js/parsers/jwplayer.parsers.js',
                    'src/js/parsers/jwplayer.parsers.*.js',
                    'src/js/playlist/jwplayer.playlist.js',
                    'src/js/playlist/jwplayer.playlist.*.js',
                    'src/js/embed/jwplayer.embed.js',
                    'src/js/embed/jwplayer.embed.*.js',
                    'src/js/api/jwplayer.api.js',
                    'src/js/api/jwplayer.api.*.js',
                    'src/js/jwplayer.sourceend.js'
                ],
                dest: 'bin-debug/jwplayer.js'
            },
            html5: {
                src: [
                    'src/js/html5/jwplayer.html5.js',
                    'src/js/html5/utils/jwplayer.html5.utils.js',
                    'src/js/html5/utils/jwplayer.html5.utils.*.js',
                    'src/js/html5/parsers/jwplayer.html5.parsers.js',
                    'src/js/html5/parsers/jwplayer.html5.parsers.*.js',
                    'src/js/html5/jwplayer.html5.*.js'
                ],
                dest: 'bin-debug/jwplayer.html5.js'
            }
        },


        replace : {
            shared : {
                src: 'bin-debug/jwplayer.js',
                overwrite: true,
                replacements:[{
                    from : /jwplayer\.version = '(.*)'/,
                    to   : 'jwplayer.version = \'<%= pkg.version %>\''
                }]
            },
            html5 : {
                src: 'bin-debug/jwplayer.html5.js',
                overwrite: true,
                replacements:[{
                    from : /jwplayer\.html5\.version = '(.*)'/,
                    to   : 'jwplayer.html5.version = \'<%= pkg.version %>\''
                }]
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
                mangle: {
                    except: ['RESERVED_KEYWORDS_TO_PROTECT']
                }
            },
            my_target : {
                files: {
                    'bin-release/jwplayer.js' : 'bin-debug/jwplayer.js',
                    'bin-release/jwplayer.html5.js' :
                        'bin-debug/jwplayer.html5.js'
                }
            }
        },

        watch : {
            all : {
                files : [
                    'src/js/**/*.js',
                    'Gruntfile.js',
                    '.jshintrc',
                    '.jshintignore',
                    'package.json'
                ],
                tasks: ['jshint:all', 'default']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('default', ['concat', 'replace', 'uglify']);
};

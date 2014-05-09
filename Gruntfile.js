module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        concat: {
            options: {
                separator: ''
            },
            embedder: {
                // Note: We are not setting the version!!
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
                // Note: We are not setting the version!!
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


        uglify : {
            options: {
                mangle: {
                    except: ['RESERVED_KEYWORDS_TO_PROTECT']
                }
            },
            my_target : {
                files: {
                    'bin-release/jwplayer.js' : 'bin-debug/jwplayer.js',
                    'bin-release/jwplayer.html5.js' : 'bin-debug/jwplayer.html5.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    

    grunt.registerTask('default', ['concat', 'uglify']);

}

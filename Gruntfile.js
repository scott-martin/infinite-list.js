/*global module*/
module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: true
            },
            all: ['*.js', '!*.min.js']
        },
        uglify: {
            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            }
        },
        jasmine: {
            hashlist: {
                src: '<%= pkg.name %>.js',
                options: {
                    vendor: 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js',
                    specs: './test/spec/hashlist-spec.js'
                }
            }
        },
        mocha: {
            src: './test/mocha/test.html',
            options: {
                run: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('default', ['jshint', 'uglify', 'jasmine']);
    grunt.registerTask('test', ['jshint', 'jasmine']);
};
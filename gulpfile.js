const gulp = require('gulp');
var browserify = require('browserify');
var babel = require("gulp-babel");
var rename = require('gulp-rename');
var babelify = require("babelify");
var source = require('vinyl-source-stream');

const bundle = gulp.task('bundle', function () {
    return browserify('lib/main.js').transform(babelify.configure({
        presets: ["es2017"]
    }))
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('bundle.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('public/build/'));
})

module.exports.bundle = bundle

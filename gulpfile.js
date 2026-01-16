const { src, dest, parallel, series} = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const { deleteAsync } = require('del');

function clean() {
    return deleteAsync(['dist/**']); // Clears everything inside 'dist'
}

// Task to minify CSS
function minifyCSS() {
    return src('src/gs-colorpicker.css')
        .pipe(cleanCSS({ level: 2 }))
        .pipe(dest('dist/assets/css'))
}

function copyTypes() {
    return src('src/gs-colorpicker.d.ts')
        .pipe(cleanCSS({ level: 2 }))
        .pipe(dest('dist/ts/types'))
}

// Task to minify JavaScript (ES6+ support)
function minifyJS() {
    return src(['src/utils.js','src/gs-colorpicker.js'])
        .pipe(terser({
            format: {
                comments: false // This removes all comments including @license and @preserve
            }
        }))
        .pipe(dest('dist/assets/lib'))
}

exports.minifyCSS = minifyCSS;
exports.minifyJS = minifyJS;
exports.default = series(clean, minifyCSS, minifyJS, copyTypes);
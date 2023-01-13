const gulp = require('gulp');

const srcFileGlob = ['./src/*.*'];

gulp.task('populateTestDirectory', () => {
	return gulp.src(srcFileGlob, { base: './' })
		.pipe(gulp.dest('./test/'));
});

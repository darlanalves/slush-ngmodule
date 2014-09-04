module.exports = function(config) {

	config.set({
		basePath: '..',
		colors: true,

		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: ['progress' /*, 'coverage'*/ ],

		// level of logging
		// possible values: config.LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
		//logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: false,

		proxies: {
			'/': 'http://localhost:8000/'
		},

		files: [
			// load vendor files, like AngularJS
			'vendor/vendor-name/vendor-index.js',

			// load mockups for unit testing
			'test/mock/module-mocks.js',

			// this is the file built by gulp
			'dist/module.js',

			// and here's your specs, anything in the form of SomeComponent.spec.js
			'test/unit/**/*.spec.js'
		],

		urlRoot: '/__karma__/',

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		// frameworks to use
		browsers: ['PhantomJS'],

		frameworks: ['jasmine'],

		// web server port
		port: 9800,

		// NOTE: the "**/" portion is essential to get the coverage results
		// preprocessors: {
		// '**/src/**/*.js': 'coverage'
		// },

		coverageReporter: {
			type: 'html',
			dir: 'test/coverage/'
		}
	});
};
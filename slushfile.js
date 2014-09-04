/*
 * slush-ngmodule
 * https://github.com/darlanalves/slush-ngmodule
 *
 * Copyright (c) 2014, Darlan Alves
 * Licensed under the MIT license.
 */

'use strict';

/* global require,process,console,__dirname */
var gulp = require('gulp'),
	util = require('gulp-util'),
	multipipe = require('multipipe'),
	conflict = require('gulp-conflict'),
	install = require('gulp-install'),
	template = require('gulp-template'),
	rename = require('gulp-rename'),
	_ = require('underscore.string'),
	inquirer = require('inquirer'),
	fs = require('fs'),
	async = require('async');

gulp.task('default', function(done) {
	var defaults = (function() {
		var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
			workingDirName = process.cwd().split('/').pop().split('\\').pop(),
			osUserName = homeDir && homeDir.split('/').pop() || 'root',
			configFile = homeDir + '/.gitconfig',
			user = {};

		if (fs.existsSync(configFile)) {
			user = require('iniparser').parseSync(configFile).user;
		}

		var bower = {};
		if (fs.existsSync('./bower.json')) {
			bower = readJSON('./bower.json');
		}

		var defaultValues = {
			appName: bower.name || workingDirName,
			appDescription: bower.description || '',
			appVersion: bower.version || '0.1.0',
			userName: format(user.name) || osUserName,
			authorEmail: user.email || '',
			mainFile: bower.main || '',
			appRepository: bower.repository ? bower.repository.url : ''
		};

		if (typeof bower.author === 'object') {
			defaultValues.authorName = bower.author.name;
			if (bower.author.email) defaultValues.authorEmail = bower.author.email;
		} else {
			defaultValues.authorName = bower.author;
		}

		return defaultValues;
	})();

	var prompts = [{
			name: 'appName',
			message: 'What is the name of your project?',
			default: defaults.appName
		}, {
			name: 'appDescription',
			message: 'What is the description?',
			default: defaults.appDescription
		}, {
			name: 'appVersion',
			message: 'What is the version of your project?',
			default: defaults.appVersion
		}, {
			name: 'authorName',
			message: 'What is the author name?',
			default: defaults.authorName
		}, {
			name: 'authorEmail',
			message: 'What is the author email?',
			default: defaults.authorEmail
		}, {
			name: 'userName',
			message: 'What is the github username?',
			default: defaults.userName
		}, {
			name: 'appRepository',
			message: 'Repository URL',
			default: defaults.appRepository
		}, {
			type: 'confirm',
			name: 'private',
			message: 'Mark as a private package?'
		},

		{
			type: 'confirm',
			name: 'install',
			message: 'Install npm dependencies?'
		},

		{
			type: 'confirm',
			name: 'moveon',
			message: 'Continue?'
		}
	];

	function askAndExecuteTasks() {
		inquirer.prompt(prompts,
			function(answers) {
				if (!answers.moveon) {
					Object.keys(answers).forEach(function(key) {
						if (key in defaults) {
							defaults[key] = answers[key];
						}
					});

					console.log('\n');

					return askAndExecuteTasks();
				}

				answers.appNameSlug = _.slugify(answers.appName);

				async.series([

					function(callback) {
						util.log('Copying files');
						copyFiles(answers, callback);
					},

					function(callback) {
						util.log('Creating manifest files');
						createPackageFiles(answers, callback);
					},

					function(callback) {
						if (answers.install) {
							util.log('Installing NPM modules');
							installNpmModules(callback);
							return;
						}

						callback();
					}
				], function(err) {
					if (err) util.log(util.colors.red('[error] ') + err);

					done();
				});
			});
	}

	function createPackageFiles(answers, callback) {
		var bower = readJSON('./bower.json'),
			npm = readJSON('./package.json');

		if (answers.userName) {
			bower.repository = npm.repository = {
				'type': 'git',
				'url': 'git://github.com/' + answers.userName + '/' + answers.appName + '.git'
			};
		}

		if (answers.authorName) {
			var author = answers.authorName;

			if (answers.authorEmail) {
				author = {
					name: answers.authorName,
					email: answers.authorEmail
				};
			}

			bower.author = npm.author = author;
		}

		bower.private = answers.private;
		bower.repository = npm.repository = answers.appRepository;

		bower.main = './dist/module.js';
		npm.main = './dist/index.js';

		fs.writeFileSync('./bower.json', JSON.stringify(bower, null, '\t'));
		fs.writeFileSync('./package.json', JSON.stringify(npm, null, '\t'));

		callback(null, true);
	}

	function copyFiles(answers, callback) {
		var pipe = multipipe(
			gulp.src(__dirname + '/templates/**'),
			template(answers),
			rename(function(file) {
				if (file.basename[0] === '_') {
					file.basename = '.' + file.basename.slice(1);
				}
			}),
			conflict('./'),
			gulp.dest('./')
		);

		pipe.on('data', function(data) {
			return data;
		});

		pipe.on('error', callback);

		pipe.on('end', function(err) {
			if (err) {
				util.log(util.colors.red('Failed to copy files'));
			} else {
				util.log('Files copied');
			}

			callback(err, true);
		});
	}

	function format(string) {
		var username = string.toLowerCase();
		return username.replace(/\s/g, '');
	}

	function readJSON(path) {
		return JSON.parse(fs.readFileSync(path) + '');
	}

	askAndExecuteTasks();

});

function installNpmModules(callback) {
	var pipe = multipipe(gulp.src('./package.json'), install());

	pipe.on('end', function() {
		util.log('Modules installed');
		callback(null, true);
	});

	pipe.on('data', function(data) {
		return data;
	});

	pipe.on('error', callback);
}
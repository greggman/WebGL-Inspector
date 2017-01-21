const path = require('path');
const fs = require('fs');

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  //console.log("client_id:", process.env.chromeAppStoreClientId);
  //console.log("client_secret:", process.env.chromeAppStoreClientSecret);
  //console.log("refresh_token:", process.env.chromeAppStoreRefreshToken);
  //console.log("appID:", process.env.chromeAppStoreId);

  const notReleaseFile = (function() {
      const releaseFiles = fs.readdirSync('core/extensions/web-extension-release');

      function notReleaseFile(filename) {
        const name = path.basename(filename);
        return releaseFiles.indexOf(name) < 0;
      }
  }());

  grunt.initConfig({
    webstore_upload: {
      "accounts": {
        "default": { //account under this section will be used by default
          publish: true, //publish item right after uploading. default false
          client_id: process.env.chromeAppStoreClientId,
          client_secret: process.env.chromeAppStoreClientSecret,
          refresh_token: process.env.chromeAppStoreRefreshToken,
        },
      },
      "extensions": {
        "extension1": {
          //required
          appID: process.env.chromeAppStoreId,
          //required, we can use dir name and upload most recent zip file
          zip: "build/webgl-inspector-beta.zip",
        },
      },
    },
    clean: {
      build: [ 'build' ],
    },
    concat: {
      css: {
        src: [
          'core/dependencies/reset-context.css',
          'core/dependencies/syntaxhighlighter_3.0.83/shCore.css',
          'core/dependencies/syntaxhighlighter_3.0.83/shThemeDefault.css',
          'core/dependencies/ui/gli.css',
        ],
        dest: 'core/lib/gli.all.css',
      },
    },
    copy: {
      assets: {
        files: [
          {expand: true, cwd: 'core/ui/assets', src: ['**'], dest: 'core/lib/assets/'},
        ],
      },
      extensions: {
        files: [
          {expand: true, cwd: 'core/lib', src: ['**'], dest: 'core/extensions/web-extension/'},
          {expand: true, cwd: 'core/lib', src: ['**'], dest: 'core/extensions/webglinspector.safariextension/'},
        ],
      },
    },
    compress: {
      webExtensionBeta: {
        options: {
          archive: 'build/webgl-inspector-beta.zip',
        },
        files: [
          { expand: true, cwd: 'core/extensions/web-extension/', src: [ '**' ], dest: '/', filter: 'isFile' },
        ],
      },
      webExtensionRelease: {
        options: {
          archive: 'build/webgl-inspector-release.zip',
        },
        files: [
          { expand: true, cwd: 'core/extensions/web-extension/', src: [ '**' ], dest: '/', filter: notReleaseFile },
          { expand: true, cwd: 'core/extensions/web-extension-release/', src: [ '**' ], dest: '/', filter: 'isFile' },
        ],
      },
    },
    webpack: {
      extension: {
        context: __dirname + "/core",
        entry: "./gli.js",
        output: {
          filename: "gli.all.js",
          path: __dirname + "/lib",
        },
        displayModules: true,
        module: {
          loaders: [
            {
              test: /\.js$/,
              loader: 'babel-loader',
              query: {
                presets: ['stage-0', 'es2015'],
              },
            },
            {
              test: /dependencies\/stacktrace\.js/,
              loader: 'exports?printStackTrace',
            },
            {
              test: /dependencies\/syntaxhighlighter_3.0.83\/shBrushGLSL\.js/,
              loader: 'imports?SyntaxHighlighter',
            },
            {
              test: /dependencies\/syntaxhighlighter_3.0.83\/shCore\.js/,
              loader: 'exports?SyntaxHighlighter',
            },
          ],
          noParse: [
            // /dependencies\/syntaxhighlighter_3.0.83\/shBrushGLSL\.js/,
            /dependencies\/syntaxhighlighter_3.0.83\/shCore\.js/,
          ]
        },
        resolve: {
          alias: {
            StackTrace: __dirname + '/core/dependencies/stacktrace.js',
            SyntaxHighlighterGLSL: __dirname + '/core/dependencies/syntaxhighlighter_3.0.83/shBrushGLSL.js',
            SyntaxHighlighter: __dirname + '/core/dependencies/syntaxhighlighter_3.0.83/shCore.js',
            shCore: __dirname + '/core/dependencies/syntaxhighlighter_3.0.83/shCore.js',
          },
        },
      },
    },
  });

  grunt.registerTask('build', [
      'clean',
      'concat:css',
      'copy:assets',
      'webpack:extension',
      'copy:extensions',
      'compress',
  ]);
  grunt.registerTask('publish', [
      'build',
      'webstore_upload',
  ]);
  grunt.registerTask('default', 'build');
};


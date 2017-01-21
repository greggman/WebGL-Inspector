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

      return function notReleaseFile(filename) {
        const name = path.basename(filename);
        const stat = fs.statSync(filename);
        const isNotReleaseFile = releaseFiles.indexOf(name) < 0;
        return isNotReleaseFile && !stat.isDirectory();
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
      build: [
        'build',
        'core/lib/assets',
        'core/extensions/web-extension/assets',
        'core/extensions/safarai/webglinpector.safariextension/assets',
      ],
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
          {expand: true, cwd: 'core/lib', src: ['**'], dest: 'core/extensions/safari/webglinspector.safariextension/'},
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

  grunt.registerTask('syncversion', function() {

    function handleJSON(version, origText) {
      const json = JSON.parse(origText);
      json.version = version;
      return JSON.stringify(json, null, 2);
    }

    const plistRE1 = /(<key>CFBundleShortVersionString<\/key>[ \n\t]+<string>)([^<]+)(<\/string>)/
    const plistRE2 = /(<key>CFBundleVersion<\/key>[ \n\t]+<string>)([^<]+)(<\/string>)/
    function handlePLIST(version, origText) {
      return origText.replace(plistRE1, `$1${version}$3`).replace(plistRE2, `$1${version}$3`);
    }

    const handlers = {
      ".json": handleJSON,
      ".plist": handlePLIST,
    };

    const pkg = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));
    const version = pkg.version;

    [
      'core/manifest.json',
      'core/extensions/web-extension/manifest.json',
      'core/extensions/web-extension-release/manifest.json',
      'core/extensions/firefox-legacy/package.json',
      'core/extensions/safari/webglinspector.safariextension/Info.plist',
    ].forEach(name => {
      const origText = fs.readFileSync(name, {encoding: 'utf8'});
      const ext = path.extname(name);
      const handler = handlers[ext];
      if (!handler) {
        throw "unsupported format";
      }
      const newText = handler(version, origText);
      if (newText !== origText) {
        fs.writeFileSync(name, newText, {encoding: 'utf8'});
      }
    });
  });

  grunt.registerTask('build', [
      'clean',
      'concat:css',
      'syncversion',
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


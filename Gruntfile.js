module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  console.log("client_id:", process.env.chromeAppStoreClientId);
  console.log("client_secret:", process.env.chromeAppStoreClientSecret);
  console.log("refresh_token:", process.env.chromeAppStoreRefreshToken);
  console.log("appID:", process.env.chromeAppStoreId);

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
          zip: "build/chrome-webgl-inspector-beta.zip",
        },
      },
    },
    clean: {
      build: [ 'build' ],
    },
    compress: {
      chrome: {
        options: {
          archive: 'build/chrome-webgl-inspector-beta.zip',
        },
        files: [
          { expand: true, cwd: 'core/extensions/chrome/', src: [ '**' ], dest: '/', filter: 'isFile' },
        ],
      },
      firefox: {
        options: {
          archive: 'build/firefox-webgl-inspector-beta.zip',
        },
        files: [
          { expand: true, cwd: 'core/extensions/firefox/', src: [ '**' ], dest: '/', filter: 'isFile' },
        ],
      },
    },
  });

  grunt.registerTask('build', [
      'clean',
      'compress',
  ]);
  grunt.registerTask('publish', [
      'build',
      'webstore_upload',
  ]);
  grunt.registerTask('default', 'build');
};


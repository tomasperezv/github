# Github.js

[![Downloads per month](https://img.shields.io/npm/dm/github-api.svg?maxAge=2592000)][npm-package]
[![Latest version](https://img.shields.io/npm/v/github-api.svg?maxAge=3600)][npm-package]
[![Gitter](https://img.shields.io/gitter/room/michael/github.js.svg?maxAge=2592000)][gitter]
[![Travis](https://img.shields.io/travis/michael/github.svg?maxAge=60)][travis-ci]
<!-- [![Codecov](https://img.shields.io/codecov/c/github/michael/github.svg?maxAge=2592000)][codecov] -->

Github.js provides a minimal higher-level wrapper around Github's API. It was concieved in the context of
[Prose][prose], a content editor for GitHub.

## Docs
Read the [docs][docs]

## Installation
Github.js is available from `npm` or (soon) [cdnjs][cdnjs].

```
npm install github-api
```

## Compatibility
Github.js is tested on Node:
* 0.10
* 0.12
* 4.x
* 5.x

## GitHub Tools

The team behind Github.js has created a whole organization, called [GitHub Tools](https://github.com/github-tools),
dedicated to GitHub and its API. In the near future this repository could be moved under the GitHub Tools organization
as well. In the meantime, we recommend you to take a look at other projects of the organization.

## Samples

```javascript
/*
   Data can be retrieved from the API either using callbacks (as in versions < 1.0)
   or using a new promise-based API. For now the promise-based API just returns the
   raw HTTP request promise; this might change in the next version.
 */
var GitHub = require('github-api');

// unauthenticated client
var gh = new GitHub();
var gist = gh.getGist(); // not a gist yet
gist.create({
   public: true,
   description: 'My first gist',
   files: {
      "file1.txt": {
         contents: "Aren't gists great!"
      }
   }
}).then(function(httpResponse) {
   // Promises!
   var gist = httpResponse.data;
   gist.read(function(err, gist, xhr) {
      // if no error occurred then err == null

      // gist == httpResponse.data

      // xhr == httpResponse
   });
});
```

```javascript
var GitHub = require('github-api');

// basic auth
var gh = new GitHub({
   username: 'FOO',
   password: 'NotFoo'
});

var me = gh.getUser();
me.getNotification(function(err, notifcations) {
   // do some stuff
});

var clayreimann = gh.getUser('clayreimann');
clayreimann.getStarredRepos()
   .then(function(httpPromise) {
      var repos = httpPromise.data;
   });
```

```javascript
var GitHub = require('github-api');

// token auth
var gh = new GitHub({
   token: 'MY_OAUTH_TOKEN'
});

var yahoo = gh.getOrganization('yahoo');
yahoo.getRepos(function(err, repos) {
   // look at all the repos!
})
```

[cdnjs]: https://cdnjs.com/
[codecov]: https://codecov.io/github/michael/github?branch=master
[travis-ci]: https://travis-ci.org/michael/github
[gitter]: https://gitter.im/michael/github
[npm-package]: https://www.npmjs.com/package/github-api
[prose]: http://prose.io
[xhr-link]: http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
[docs]: http://michael.github.io/github/

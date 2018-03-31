'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _jsBase = require('js-base64');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @copyright  2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var log = (0, _debug2.default)('github:request');

/**
 * The error structure returned when a network call fails
 */

var ResponseError = function (_Error) {
   _inherits(ResponseError, _Error);

   /**
    * Construct a new ResponseError
    * @param {string} message - an message to return instead of the the default error message
    * @param {string} path - the requested path
    * @param {Object} response - the object returned by Axios
    */
   function ResponseError(message, path, response) {
      _classCallCheck(this, ResponseError);

      var _this = _possibleConstructorReturn(this, (ResponseError.__proto__ || Object.getPrototypeOf(ResponseError)).call(this, message));

      _this.path = path;
      _this.request = response.config;
      _this.response = (response || {}).response || response;
      _this.status = response.status;
      return _this;
   }

   return ResponseError;
}(Error);

/**
 * Requestable wraps the logic for making http requests to the API
 */


var Requestable = function () {
   /**
    * Either a username and password or an oauth token for Github
    * @typedef {Object} Requestable.auth
    * @prop {string} [username] - the Github username
    * @prop {string} [password] - the user's password
    * @prop {token} [token] - an OAuth token
    */
   /**
    * Initialize the http internals.
    * @param {Requestable.auth} [auth] - the credentials to authenticate to Github. If auth is
    *                                  not provided request will be made unauthenticated
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    * @param {string} [AcceptHeader=v3] - the accept header for the requests
    */
   function Requestable(auth, apiBase, AcceptHeader) {
      _classCallCheck(this, Requestable);

      this.__apiBase = apiBase || 'https://api.github.com';
      this.__auth = {
         token: auth.token,
         username: auth.username,
         password: auth.password
      };
      this.__AcceptHeader = AcceptHeader || 'v3';

      if (auth.token) {
         this.__authorizationHeader = 'token ' + auth.token;
      } else if (auth.username && auth.password) {
         this.__authorizationHeader = 'Basic ' + _jsBase.Base64.encode(auth.username + ':' + auth.password);
      }
   }

   /**
    * Compute the URL to use to make a request.
    * @private
    * @param {string} path - either a URL relative to the API base or an absolute URL
    * @return {string} - the URL to use
    */


   _createClass(Requestable, [{
      key: '__getURL',
      value: function __getURL(path) {
         var url = path;

         if (path.indexOf('//') === -1) {
            url = this.__apiBase + path;
         }

         var newCacheBuster = 'timestamp=' + new Date().getTime();
         return url.replace(/(timestamp=\d+)/, newCacheBuster);
      }

      /**
       * Compute the headers required for an API request.
       * @private
       * @param {boolean} raw - if the request should be treated as JSON or as a raw request
       * @param {string} AcceptHeader - the accept header for the request
       * @return {Object} - the headers to use in the request
       */

   }, {
      key: '__getRequestHeaders',
      value: function __getRequestHeaders(raw, AcceptHeader) {
         var headers = {
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/vnd.github.' + (AcceptHeader || this.__AcceptHeader)
         };

         if (raw) {
            headers.Accept += '.raw';
         }
         headers.Accept += '+json';

         if (this.__authorizationHeader) {
            headers.Authorization = this.__authorizationHeader;
         }

         return headers;
      }

      /**
       * Sets the default options for API requests
       * @protected
       * @param {Object} [requestOptions={}] - the current options for the request
       * @return {Object} - the options to pass to the request
       */

   }, {
      key: '_getOptionsWithDefaults',
      value: function _getOptionsWithDefaults() {
         var requestOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

         if (!(requestOptions.visibility || requestOptions.affiliation)) {
            requestOptions.type = requestOptions.type || 'all';
         }
         requestOptions.sort = requestOptions.sort || 'updated';
         requestOptions.per_page = requestOptions.per_page || '100'; // eslint-disable-line

         return requestOptions;
      }

      /**
       * if a `Date` is passed to this function it will be converted to an ISO string
       * @param {*} date - the object to attempt to cooerce into an ISO date string
       * @return {string} - the ISO representation of `date` or whatever was passed in if it was not a date
       */

   }, {
      key: '_dateToISO',
      value: function _dateToISO(date) {
         if (date && date instanceof Date) {
            date = date.toISOString();
         }

         return date;
      }

      /**
       * A function that receives the result of the API request.
       * @callback Requestable.callback
       * @param {Requestable.Error} error - the error returned by the API or `null`
       * @param {(Object|true)} result - the data returned by the API or `true` if the API returns `204 No Content`
       * @param {Object} request - the raw {@linkcode https://github.com/mzabriskie/axios#response-schema Response}
       */
      /**
       * Make a request.
       * @param {string} method - the method for the request (GET, PUT, POST, DELETE)
       * @param {string} path - the path for the request
       * @param {*} [data] - the data to send to the server. For HTTP methods that don't have a body the data
       *                   will be sent as query parameters
       * @param {Requestable.callback} [cb] - the callback for the request
       * @param {boolean} [raw=false] - if the request should be sent as raw. If this is a falsy value then the
       *                              request will be made as JSON
       * @return {Promise} - the Promise for the http request
       */

   }, {
      key: '_request',
      value: function _request(method, path, data, cb, raw) {
         var url = this.__getURL(path);

         var AcceptHeader = (data || {}).AcceptHeader;
         if (AcceptHeader) {
            delete data.AcceptHeader;
         }
         var headers = this.__getRequestHeaders(raw, AcceptHeader);

         var queryParams = {};

         var shouldUseDataAsParams = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && methodHasNoBody(method);
         if (shouldUseDataAsParams) {
            queryParams = data;
            data = undefined;
         }

         var config = {
            url: url,
            method: method,
            headers: headers,
            params: queryParams,
            data: data,
            responseType: raw ? 'text' : 'json'
         };

         log(config.method + ' to ' + config.url);
         var requestPromise = (0, _axios2.default)(config).catch(callbackErrorOrThrow(cb, path));

         if (cb) {
            requestPromise.then(function (response) {
               if (response.data && Object.keys(response.data).length > 0) {
                  // When data has results
                  cb(null, response.data, response);
               } else if (config.method !== 'GET' && Object.keys(response.data).length < 1) {
                  // True when successful submit a request and receive a empty object
                  cb(null, response.status < 300, response);
               } else {
                  cb(null, response.data, response);
               }
            });
         }

         return requestPromise;
      }

      /**
       * Make a request to an endpoint the returns 204 when true and 404 when false
       * @param {string} path - the path to request
       * @param {Object} data - any query parameters for the request
       * @param {Requestable.callback} cb - the callback that will receive `true` or `false`
       * @param {method} [method=GET] - HTTP Method to use
       * @return {Promise} - the promise for the http request
       */

   }, {
      key: '_request204or404',
      value: function _request204or404(path, data, cb) {
         var method = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'GET';

         return this._request(method, path, data).then(function success(response) {
            if (cb) {
               cb(null, true, response);
            }
            return true;
         }, function failure(response) {
            if (response.response.status === 404) {
               if (cb) {
                  cb(null, false, response);
               }
               return false;
            }

            if (cb) {
               cb(response);
            }
            throw response;
         });
      }

      /**
       * Make a request and fetch all the available data. Github will paginate responses so for queries
       * that might span multiple pages this method is preferred to {@link Requestable#request}
       * @param {string} path - the path to request
       * @param {Object} options - the query parameters to include
       * @param {Requestable.callback} [cb] - the function to receive the data. The returned data will always be an array.
       * @param {Object[]} results - the partial results. This argument is intended for interal use only.
       * @return {Promise} - a promise which will resolve when all pages have been fetched
       * @deprecated This will be folded into {@link Requestable#_request} in the 2.0 release.
       */

   }, {
      key: '_requestAllPages',
      value: function _requestAllPages(path, options, cb, results) {
         var _this2 = this;

         results = results || [];

         return this._request('GET', path, options).then(function (response) {
            var _results;

            var thisGroup = void 0;
            if (response.data instanceof Array) {
               thisGroup = response.data;
            } else if (response.data.items instanceof Array) {
               thisGroup = response.data.items;
            } else {
               var message = 'cannot figure out how to append ' + response.data + ' to the result set';
               throw new ResponseError(message, path, response);
            }
            (_results = results).push.apply(_results, _toConsumableArray(thisGroup));

            var nextUrl = getNextPage(response.headers.link);
            if (nextUrl && !(options && typeof options.page !== 'number')) {
               log('getting next page: ' + nextUrl);
               return _this2._requestAllPages(nextUrl, options, cb, results);
            }

            if (cb) {
               cb(null, results, response);
            }

            response.data = results;
            return response;
         }).catch(callbackErrorOrThrow(cb, path));
      }
   }]);

   return Requestable;
}();

module.exports = Requestable;

// ////////////////////////// //
//  Private helper functions  //
// ////////////////////////// //
var METHODS_WITH_NO_BODY = ['GET', 'HEAD', 'DELETE'];
function methodHasNoBody(method) {
   return METHODS_WITH_NO_BODY.indexOf(method) !== -1;
}

function getNextPage() {
   var linksHeader = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

   var links = linksHeader.split(/\s*,\s*/); // splits and strips the urls
   return links.reduce(function (nextUrl, link) {
      if (link.search(/rel="next"/) !== -1) {
         return (link.match(/<(.*)>/) || [])[1];
      }

      return nextUrl;
   }, undefined);
}

function callbackErrorOrThrow(cb, path) {
   return function handler(object) {
      var error = void 0;
      if (object.hasOwnProperty('config')) {
         var _object$response = object.response,
             status = _object$response.status,
             statusText = _object$response.statusText,
             _object$config = object.config,
             method = _object$config.method,
             url = _object$config.url;

         var message = status + ' error making request ' + method + ' ' + url + ': "' + statusText + '"';
         error = new ResponseError(message, path, object);
         log(message + ' ' + JSON.stringify(object.data));
      } else {
         error = object;
      }
      if (cb) {
         log('going to error callback');
         cb(error);
      } else {
         log('throwing error');
         throw error;
      }
   };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlcXVlc3RhYmxlLmpzIl0sIm5hbWVzIjpbImxvZyIsIlJlc3BvbnNlRXJyb3IiLCJtZXNzYWdlIiwicGF0aCIsInJlc3BvbnNlIiwicmVxdWVzdCIsImNvbmZpZyIsInN0YXR1cyIsIkVycm9yIiwiUmVxdWVzdGFibGUiLCJhdXRoIiwiYXBpQmFzZSIsIkFjY2VwdEhlYWRlciIsIl9fYXBpQmFzZSIsIl9fYXV0aCIsInRva2VuIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIl9fQWNjZXB0SGVhZGVyIiwiX19hdXRob3JpemF0aW9uSGVhZGVyIiwiZW5jb2RlIiwidXJsIiwiaW5kZXhPZiIsIm5ld0NhY2hlQnVzdGVyIiwiRGF0ZSIsImdldFRpbWUiLCJyZXBsYWNlIiwicmF3IiwiaGVhZGVycyIsIkFjY2VwdCIsIkF1dGhvcml6YXRpb24iLCJyZXF1ZXN0T3B0aW9ucyIsInZpc2liaWxpdHkiLCJhZmZpbGlhdGlvbiIsInR5cGUiLCJzb3J0IiwicGVyX3BhZ2UiLCJkYXRlIiwidG9JU09TdHJpbmciLCJtZXRob2QiLCJkYXRhIiwiY2IiLCJfX2dldFVSTCIsIl9fZ2V0UmVxdWVzdEhlYWRlcnMiLCJxdWVyeVBhcmFtcyIsInNob3VsZFVzZURhdGFBc1BhcmFtcyIsIm1ldGhvZEhhc05vQm9keSIsInVuZGVmaW5lZCIsInBhcmFtcyIsInJlc3BvbnNlVHlwZSIsInJlcXVlc3RQcm9taXNlIiwiY2F0Y2giLCJjYWxsYmFja0Vycm9yT3JUaHJvdyIsInRoZW4iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiX3JlcXVlc3QiLCJzdWNjZXNzIiwiZmFpbHVyZSIsIm9wdGlvbnMiLCJyZXN1bHRzIiwidGhpc0dyb3VwIiwiQXJyYXkiLCJpdGVtcyIsInB1c2giLCJuZXh0VXJsIiwiZ2V0TmV4dFBhZ2UiLCJsaW5rIiwicGFnZSIsIl9yZXF1ZXN0QWxsUGFnZXMiLCJtb2R1bGUiLCJleHBvcnRzIiwiTUVUSE9EU19XSVRIX05PX0JPRFkiLCJsaW5rc0hlYWRlciIsImxpbmtzIiwic3BsaXQiLCJyZWR1Y2UiLCJzZWFyY2giLCJtYXRjaCIsImhhbmRsZXIiLCJvYmplY3QiLCJlcnJvciIsImhhc093blByb3BlcnR5Iiwic3RhdHVzVGV4dCIsIkpTT04iLCJzdHJpbmdpZnkiXSwibWFwcGluZ3MiOiI7Ozs7OztBQU9BOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7OzsrZUFUQTs7Ozs7OztBQVdBLElBQU1BLE1BQU0scUJBQU0sZ0JBQU4sQ0FBWjs7QUFFQTs7OztJQUdNQyxhOzs7QUFDSDs7Ozs7O0FBTUEsMEJBQVlDLE9BQVosRUFBcUJDLElBQXJCLEVBQTJCQyxRQUEzQixFQUFxQztBQUFBOztBQUFBLGdJQUM1QkYsT0FENEI7O0FBRWxDLFlBQUtDLElBQUwsR0FBWUEsSUFBWjtBQUNBLFlBQUtFLE9BQUwsR0FBZUQsU0FBU0UsTUFBeEI7QUFDQSxZQUFLRixRQUFMLEdBQWdCLENBQUNBLFlBQVksRUFBYixFQUFpQkEsUUFBakIsSUFBNkJBLFFBQTdDO0FBQ0EsWUFBS0csTUFBTCxHQUFjSCxTQUFTRyxNQUF2QjtBQUxrQztBQU1wQzs7O0VBYndCQyxLOztBQWdCNUI7Ozs7O0lBR01DLFc7QUFDSDs7Ozs7OztBQU9BOzs7Ozs7O0FBT0Esd0JBQVlDLElBQVosRUFBa0JDLE9BQWxCLEVBQTJCQyxZQUEzQixFQUF5QztBQUFBOztBQUN0QyxXQUFLQyxTQUFMLEdBQWlCRixXQUFXLHdCQUE1QjtBQUNBLFdBQUtHLE1BQUwsR0FBYztBQUNYQyxnQkFBT0wsS0FBS0ssS0FERDtBQUVYQyxtQkFBVU4sS0FBS00sUUFGSjtBQUdYQyxtQkFBVVAsS0FBS087QUFISixPQUFkO0FBS0EsV0FBS0MsY0FBTCxHQUFzQk4sZ0JBQWdCLElBQXRDOztBQUVBLFVBQUlGLEtBQUtLLEtBQVQsRUFBZ0I7QUFDYixjQUFLSSxxQkFBTCxHQUE2QixXQUFXVCxLQUFLSyxLQUE3QztBQUNGLE9BRkQsTUFFTyxJQUFJTCxLQUFLTSxRQUFMLElBQWlCTixLQUFLTyxRQUExQixFQUFvQztBQUN4Qyxj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QVM2RSxPQUFULENBQWlCQyxNQUFqQixFQUF5QjtBQUM3QixVQUFJQyxjQUFKO0FBQ0EsVUFBSUQsT0FBT0UsY0FBUCxDQUFzQixRQUF0QixDQUFKLEVBQXFDO0FBQUEsZ0NBQzhCRixNQUQ5QixDQUMzQjdFLFFBRDJCO0FBQUEsYUFDaEJHLE1BRGdCLG9CQUNoQkEsTUFEZ0I7QUFBQSxhQUNSNkUsVUFEUSxvQkFDUkEsVUFEUTtBQUFBLDhCQUM4QkgsTUFEOUIsQ0FDSzNFLE1BREw7QUFBQSxhQUNjaUMsTUFEZCxrQkFDY0EsTUFEZDtBQUFBLGFBQ3NCbEIsR0FEdEIsa0JBQ3NCQSxHQUR0Qjs7QUFFbEMsYUFBSW5CLFVBQWNLLE1BQWQsOEJBQTZDZ0MsTUFBN0MsU0FBdURsQixHQUF2RCxXQUFnRStELFVBQWhFLE1BQUo7QUFDQUYsaUJBQVEsSUFBSWpGLGFBQUosQ0FBa0JDLE9BQWxCLEVBQTJCQyxJQUEzQixFQUFpQzhFLE1BQWpDLENBQVI7QUFDQWpGLGFBQU9FLE9BQVAsU0FBa0JtRixLQUFLQyxTQUFMLENBQWVMLE9BQU96QyxJQUF0QixDQUFsQjtBQUNGLE9BTEQsTUFLTztBQUNKMEMsaUJBQVFELE1BQVI7QUFDRjtBQUNELFVBQUl4QyxFQUFKLEVBQVE7QUFDTHpDLGFBQUkseUJBQUo7QUFDQXlDLFlBQUd5QyxLQUFIO0FBQ0YsT0FIRCxNQUdPO0FBQ0psRixhQUFJLGdCQUFKO0FBQ0EsZUFBTWtGLEtBQU47QUFDRjtBQUNILElBakJEO0FBa0JGIiwiZmlsZSI6IlJlcXVlc3RhYmxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZVxuICogQGNvcHlyaWdodCAgMjAxNiBZYWhvbyBJbmMuXG4gKiBAbGljZW5zZSAgICBMaWNlbnNlZCB1bmRlciB7QGxpbmsgaHR0cHM6Ly9zcGR4Lm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2UtQ2xlYXIuaHRtbCBCU0QtMy1DbGF1c2UtQ2xlYXJ9LlxuICogICAgICAgICAgICAgR2l0aHViLmpzIGlzIGZyZWVseSBkaXN0cmlidXRhYmxlLlxuICovXG5cbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHtCYXNlNjR9IGZyb20gJ2pzLWJhc2U2NCc7XG5cbmNvbnN0IGxvZyA9IGRlYnVnKCdnaXRodWI6cmVxdWVzdCcpO1xuXG4vKipcbiAqIFRoZSBlcnJvciBzdHJ1Y3R1cmUgcmV0dXJuZWQgd2hlbiBhIG5ldHdvcmsgY2FsbCBmYWlsc1xuICovXG5jbGFzcyBSZXNwb25zZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgLyoqXG4gICAgKiBDb25zdHJ1Y3QgYSBuZXcgUmVzcG9uc2VFcnJvclxuICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBhbiBtZXNzYWdlIHRvIHJldHVybiBpbnN0ZWFkIG9mIHRoZSB0aGUgZGVmYXVsdCBlcnJvciBtZXNzYWdlXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSByZXF1ZXN0ZWQgcGF0aFxuICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIC0gdGhlIG9iamVjdCByZXR1cm5lZCBieSBBeGlvc1xuICAgICovXG4gICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBwYXRoLCByZXNwb25zZSkge1xuICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgICAgdGhpcy5yZXF1ZXN0ID0gcmVzcG9uc2UuY29uZmlnO1xuICAgICAgdGhpcy5yZXNwb25zZSA9IChyZXNwb25zZSB8fCB7fSkucmVzcG9uc2UgfHwgcmVzcG9uc2U7XG4gICAgICB0aGlzLnN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcbiAgIH1cbn1cblxuLyoqXG4gKiBSZXF1ZXN0YWJsZSB3cmFwcyB0aGUgbG9naWMgZm9yIG1ha2luZyBodHRwIHJlcXVlc3RzIHRvIHRoZSBBUElcbiAqL1xuY2xhc3MgUmVxdWVzdGFibGUge1xuICAgLyoqXG4gICAgKiBFaXRoZXIgYSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgb3IgYW4gb2F1dGggdG9rZW4gZm9yIEdpdGh1YlxuICAgICogQHR5cGVkZWYge09iamVjdH0gUmVxdWVzdGFibGUuYXV0aFxuICAgICogQHByb3Age3N0cmluZ30gW3VzZXJuYW1lXSAtIHRoZSBHaXRodWIgdXNlcm5hbWVcbiAgICAqIEBwcm9wIHtzdHJpbmd9IFtwYXNzd29yZF0gLSB0aGUgdXNlcidzIHBhc3N3b3JkXG4gICAgKiBAcHJvcCB7dG9rZW59IFt0b2tlbl0gLSBhbiBPQXV0aCB0b2tlblxuICAgICovXG4gICAvKipcbiAgICAqIEluaXRpYWxpemUgdGhlIGh0dHAgaW50ZXJuYWxzLlxuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5hdXRofSBbYXV0aF0gLSB0aGUgY3JlZGVudGlhbHMgdG8gYXV0aGVudGljYXRlIHRvIEdpdGh1Yi4gSWYgYXV0aCBpc1xuICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IHByb3ZpZGVkIHJlcXVlc3Qgd2lsbCBiZSBtYWRlIHVuYXV0aGVudGljYXRlZFxuICAgICogQHBhcmFtIHtzdHJpbmd9IFthcGlCYXNlPWh0dHBzOi8vYXBpLmdpdGh1Yi5jb21dIC0gdGhlIGJhc2UgR2l0aHViIEFQSSBVUkxcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbQWNjZXB0SGVhZGVyPXYzXSAtIHRoZSBhY2NlcHQgaGVhZGVyIGZvciB0aGUgcmVxdWVzdHNcbiAgICAqL1xuICAgY29uc3RydWN0b3IoYXV0aCwgYXBpQmFzZSwgQWNjZXB0SGVhZGVyKSB7XG4gICAgICB0aGlzLl9fYXBpQmFzZSA9IGFwaUJhc2UgfHwgJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20nO1xuICAgICAgdGhpcy5fX2F1dGggPSB7XG4gICAgICAgICB0b2tlbjogYXV0aC50b2tlbixcbiAgICAgICAgIHVzZXJuYW1lOiBhdXRoLnVzZXJuYW1lLFxuICAgICAgICAgcGFzc3dvcmQ6IGF1dGgucGFzc3dvcmQsXG4gICAgICB9O1xuICAgICAgdGhpcy5fX0FjY2VwdEhlYWRlciA9IEFjY2VwdEhlYWRlciB8fCAndjMnO1xuXG4gICAgICBpZiAoYXV0aC50b2tlbikge1xuICAgICAgICAgdGhpcy5fX2F1dGhvcml6YXRpb25IZWFkZXIgPSAndG9rZW4gJyArIGF1dGgudG9rZW47XG4gICAgICB9IGVsc2UgaWYgKGF1dGgudXNlcm5hbWUgJiYgYXV0aC5wYXNzd29yZCkge1xuICAgICAgICAgdGhpcy5fX2F1dGhvcml6YXRpb25IZWFkZXIgPSAnQmFzaWMgJyArIEJhc2U2NC5lbmNvZGUoYXV0aC51c2VybmFtZSArICc6JyArIGF1dGgucGFzc3dvcmQpO1xuICAgICAgfVxuICAgfVxuXG4gICAvKipcbiAgICAqIENvbXB1dGUgdGhlIFVSTCB0byB1c2UgdG8gbWFrZSBhIHJlcXVlc3QuXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBlaXRoZXIgYSBVUkwgcmVsYXRpdmUgdG8gdGhlIEFQSSBiYXNlIG9yIGFuIGFic29sdXRlIFVSTFxuICAgICogQHJldHVybiB7c3RyaW5nfSAtIHRoZSBVUkwgdG8gdXNlXG4gICAgKi9cbiAgIF9fZ2V0VVJMKHBhdGgpIHtcbiAgICAgIGxldCB1cmwgPSBwYXRoO1xuXG4gICAgICBpZiAocGF0aC5pbmRleE9mKCcvLycpID09PSAtMSkge1xuICAgICAgICAgdXJsID0gdGhpcy5fX2FwaUJhc2UgKyBwYXRoO1xuICAgICAgfVxuXG4gICAgICBsZXQgbmV3Q2FjaGVCdXN0ZXIgPSAndGltZXN0YW1wPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIHJldHVybiB1cmwucmVwbGFjZSgvKHRpbWVzdGFtcD1cXGQrKS8sIG5ld0NhY2hlQnVzdGVyKTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBDb21wdXRlIHRoZSBoZWFkZXJzIHJlcXVpcmVkIGZvciBhbiBBUEkgcmVxdWVzdC5cbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJhdyAtIGlmIHRoZSByZXF1ZXN0IHNob3VsZCBiZSB0cmVhdGVkIGFzIEpTT04gb3IgYXMgYSByYXcgcmVxdWVzdFxuICAgICogQHBhcmFtIHtzdHJpbmd9IEFjY2VwdEhlYWRlciAtIHRoZSBhY2NlcHQgaGVhZGVyIGZvciB0aGUgcmVxdWVzdFxuICAgICogQHJldHVybiB7T2JqZWN0fSAtIHRoZSBoZWFkZXJzIHRvIHVzZSBpbiB0aGUgcmVxdWVzdFxuICAgICovXG4gICBfX2dldFJlcXVlc3RIZWFkZXJzKHJhdywgQWNjZXB0SGVhZGVyKSB7XG4gICAgICBsZXQgaGVhZGVycyA9IHtcbiAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04JyxcbiAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vdm5kLmdpdGh1Yi4nICsgKEFjY2VwdEhlYWRlciB8fCB0aGlzLl9fQWNjZXB0SGVhZGVyKSxcbiAgICAgIH07XG5cbiAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgIGhlYWRlcnMuQWNjZXB0ICs9ICcucmF3JztcbiAgICAgIH1cbiAgICAgIGhlYWRlcnMuQWNjZXB0ICs9ICcranNvbic7XG5cbiAgICAgIGlmICh0aGlzLl9fYXV0aG9yaXphdGlvbkhlYWRlcikge1xuICAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gdGhpcy5fX2F1dGhvcml6YXRpb25IZWFkZXI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFNldHMgdGhlIGRlZmF1bHQgb3B0aW9ucyBmb3IgQVBJIHJlcXVlc3RzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3JlcXVlc3RPcHRpb25zPXt9XSAtIHRoZSBjdXJyZW50IG9wdGlvbnMgZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IC0gdGhlIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgcmVxdWVzdFxuICAgICovXG4gICBfZ2V0T3B0aW9uc1dpdGhEZWZhdWx0cyhyZXF1ZXN0T3B0aW9ucyA9IHt9KSB7XG4gICAgICBpZiAoIShyZXF1ZXN0T3B0aW9ucy52aXNpYmlsaXR5IHx8IHJlcXVlc3RPcHRpb25zLmFmZmlsaWF0aW9uKSkge1xuICAgICAgICAgcmVxdWVzdE9wdGlvbnMudHlwZSA9IHJlcXVlc3RPcHRpb25zLnR5cGUgfHwgJ2FsbCc7XG4gICAgICB9XG4gICAgICByZXF1ZXN0T3B0aW9ucy5zb3J0ID0gcmVxdWVzdE9wdGlvbnMuc29ydCB8fCAndXBkYXRlZCc7XG4gICAgICByZXF1ZXN0T3B0aW9ucy5wZXJfcGFnZSA9IHJlcXVlc3RPcHRpb25zLnBlcl9wYWdlIHx8ICcxMDAnOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbiAgICAgIHJldHVybiByZXF1ZXN0T3B0aW9ucztcbiAgIH1cblxuICAgLyoqXG4gICAgKiBpZiBhIGBEYXRlYCBpcyBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhbiBJU08gc3RyaW5nXG4gICAgKiBAcGFyYW0geyp9IGRhdGUgLSB0aGUgb2JqZWN0IHRvIGF0dGVtcHQgdG8gY29vZXJjZSBpbnRvIGFuIElTTyBkYXRlIHN0cmluZ1xuICAgICogQHJldHVybiB7c3RyaW5nfSAtIHRoZSBJU08gcmVwcmVzZW50YXRpb24gb2YgYGRhdGVgIG9yIHdoYXRldmVyIHdhcyBwYXNzZWQgaW4gaWYgaXQgd2FzIG5vdCBhIGRhdGVcbiAgICAqL1xuICAgX2RhdGVUb0lTTyhkYXRlKSB7XG4gICAgICBpZiAoZGF0ZSAmJiAoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICAgICBkYXRlID0gZGF0ZS50b0lTT1N0cmluZygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZGF0ZTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBBIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHJlc3VsdCBvZiB0aGUgQVBJIHJlcXVlc3QuXG4gICAgKiBAY2FsbGJhY2sgUmVxdWVzdGFibGUuY2FsbGJhY2tcbiAgICAqIEBwYXJhbSB7UmVxdWVzdGFibGUuRXJyb3J9IGVycm9yIC0gdGhlIGVycm9yIHJldHVybmVkIGJ5IHRoZSBBUEkgb3IgYG51bGxgXG4gICAgKiBAcGFyYW0geyhPYmplY3R8dHJ1ZSl9IHJlc3VsdCAtIHRoZSBkYXRhIHJldHVybmVkIGJ5IHRoZSBBUEkgb3IgYHRydWVgIGlmIHRoZSBBUEkgcmV0dXJucyBgMjA0IE5vIENvbnRlbnRgXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdCAtIHRoZSByYXcge0BsaW5rY29kZSBodHRwczovL2dpdGh1Yi5jb20vbXphYnJpc2tpZS9heGlvcyNyZXNwb25zZS1zY2hlbWEgUmVzcG9uc2V9XG4gICAgKi9cbiAgIC8qKlxuICAgICogTWFrZSBhIHJlcXVlc3QuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kIC0gdGhlIG1ldGhvZCBmb3IgdGhlIHJlcXVlc3QgKEdFVCwgUFVULCBQT1NULCBERUxFVEUpXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSBwYXRoIGZvciB0aGUgcmVxdWVzdFxuICAgICogQHBhcmFtIHsqfSBbZGF0YV0gLSB0aGUgZGF0YSB0byBzZW5kIHRvIHRoZSBzZXJ2ZXIuIEZvciBIVFRQIG1ldGhvZHMgdGhhdCBkb24ndCBoYXZlIGEgYm9keSB0aGUgZGF0YVxuICAgICogICAgICAgICAgICAgICAgICAgd2lsbCBiZSBzZW50IGFzIHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICAqIEBwYXJhbSB7UmVxdWVzdGFibGUuY2FsbGJhY2t9IFtjYl0gLSB0aGUgY2FsbGJhY2sgZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyYXc9ZmFsc2VdIC0gaWYgdGhlIHJlcXVlc3Qgc2hvdWxkIGJlIHNlbnQgYXMgcmF3LiBJZiB0aGlzIGlzIGEgZmFsc3kgdmFsdWUgdGhlbiB0aGVcbiAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdCB3aWxsIGJlIG1hZGUgYXMgSlNPTlxuICAgICogQHJldHVybiB7UHJvbWlzZX0gLSB0aGUgUHJvbWlzZSBmb3IgdGhlIGh0dHAgcmVxdWVzdFxuICAgICovXG4gICBfcmVxdWVzdChtZXRob2QsIHBhdGgsIGRhdGEsIGNiLCByYXcpIHtcbiAgICAgIGNvbnN0IHVybCA9IHRoaXMuX19nZXRVUkwocGF0aCk7XG5cbiAgICAgIGNvbnN0IEFjY2VwdEhlYWRlciA9IChkYXRhIHx8IHt9KS5BY2NlcHRIZWFkZXI7XG4gICAgICBpZiAoQWNjZXB0SGVhZGVyKSB7XG4gICAgICAgICBkZWxldGUgZGF0YS5BY2NlcHRIZWFkZXI7XG4gICAgICB9XG4gICAgICBjb25zdCBoZWFkZXJzID0gdGhpcy5fX2dldFJlcXVlc3RIZWFkZXJzKHJhdywgQWNjZXB0SGVhZGVyKTtcblxuICAgICAgbGV0IHF1ZXJ5UGFyYW1zID0ge307XG5cbiAgICAgIGNvbnN0IHNob3VsZFVzZURhdGFBc1BhcmFtcyA9IGRhdGEgJiYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JykgJiYgbWV0aG9kSGFzTm9Cb2R5KG1ldGhvZCk7XG4gICAgICBpZiAoc2hvdWxkVXNlRGF0YUFzUGFyYW1zKSB7XG4gICAgICAgICBxdWVyeVBhcmFtcyA9IGRhdGE7XG4gICAgICAgICBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMsXG4gICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgcmVzcG9uc2VUeXBlOiByYXcgPyAndGV4dCcgOiAnanNvbicsXG4gICAgICB9O1xuXG4gICAgICBsb2coYCR7Y29uZmlnLm1ldGhvZH0gdG8gJHtjb25maWcudXJsfWApO1xuICAgICAgY29uc3QgcmVxdWVzdFByb21pc2UgPSBheGlvcyhjb25maWcpLmNhdGNoKGNhbGxiYWNrRXJyb3JPclRocm93KGNiLCBwYXRoKSk7XG5cbiAgICAgIGlmIChjYikge1xuICAgICAgICAgcmVxdWVzdFByb21pc2UudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgIC8vIFdoZW4gZGF0YSBoYXMgcmVzdWx0c1xuICAgICAgICAgICAgICAgY2IobnVsbCwgcmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb25maWcubWV0aG9kICE9PSAnR0VUJyAmJiBPYmplY3Qua2V5cyhyZXNwb25zZS5kYXRhKS5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAvLyBUcnVlIHdoZW4gc3VjY2Vzc2Z1bCBzdWJtaXQgYSByZXF1ZXN0IGFuZCByZWNlaXZlIGEgZW1wdHkgb2JqZWN0XG4gICAgICAgICAgICAgICBjYihudWxsLCAocmVzcG9uc2Uuc3RhdHVzIDwgMzAwKSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIGNiKG51bGwsIHJlc3BvbnNlLmRhdGEsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVxdWVzdFByb21pc2U7XG4gICB9XG5cbiAgIC8qKlxuICAgICogTWFrZSBhIHJlcXVlc3QgdG8gYW4gZW5kcG9pbnQgdGhlIHJldHVybnMgMjA0IHdoZW4gdHJ1ZSBhbmQgNDA0IHdoZW4gZmFsc2VcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHBhdGggdG8gcmVxdWVzdFxuICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBhbnkgcXVlcnkgcGFyYW1ldGVycyBmb3IgdGhlIHJlcXVlc3RcbiAgICAqIEBwYXJhbSB7UmVxdWVzdGFibGUuY2FsbGJhY2t9IGNiIC0gdGhlIGNhbGxiYWNrIHRoYXQgd2lsbCByZWNlaXZlIGB0cnVlYCBvciBgZmFsc2VgXG4gICAgKiBAcGFyYW0ge21ldGhvZH0gW21ldGhvZD1HRVRdIC0gSFRUUCBNZXRob2QgdG8gdXNlXG4gICAgKiBAcmV0dXJuIHtQcm9taXNlfSAtIHRoZSBwcm9taXNlIGZvciB0aGUgaHR0cCByZXF1ZXN0XG4gICAgKi9cbiAgIF9yZXF1ZXN0MjA0b3I0MDQocGF0aCwgZGF0YSwgY2IsIG1ldGhvZCA9ICdHRVQnKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVxdWVzdChtZXRob2QsIHBhdGgsIGRhdGEpXG4gICAgICAgICAudGhlbihmdW5jdGlvbiBzdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgIGNiKG51bGwsIHRydWUsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgfSwgZnVuY3Rpb24gZmFpbHVyZShyZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnJlc3BvbnNlLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICAgIGNiKG51bGwsIGZhbHNlLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgY2IocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgcmVzcG9uc2U7XG4gICAgICAgICB9KTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBNYWtlIGEgcmVxdWVzdCBhbmQgZmV0Y2ggYWxsIHRoZSBhdmFpbGFibGUgZGF0YS4gR2l0aHViIHdpbGwgcGFnaW5hdGUgcmVzcG9uc2VzIHNvIGZvciBxdWVyaWVzXG4gICAgKiB0aGF0IG1pZ2h0IHNwYW4gbXVsdGlwbGUgcGFnZXMgdGhpcyBtZXRob2QgaXMgcHJlZmVycmVkIHRvIHtAbGluayBSZXF1ZXN0YWJsZSNyZXF1ZXN0fVxuICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSB0aGUgcGF0aCB0byByZXF1ZXN0XG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIHRoZSBxdWVyeSBwYXJhbWV0ZXJzIHRvIGluY2x1ZGVcbiAgICAqIEBwYXJhbSB7UmVxdWVzdGFibGUuY2FsbGJhY2t9IFtjYl0gLSB0aGUgZnVuY3Rpb24gdG8gcmVjZWl2ZSB0aGUgZGF0YS4gVGhlIHJldHVybmVkIGRhdGEgd2lsbCBhbHdheXMgYmUgYW4gYXJyYXkuXG4gICAgKiBAcGFyYW0ge09iamVjdFtdfSByZXN1bHRzIC0gdGhlIHBhcnRpYWwgcmVzdWx0cy4gVGhpcyBhcmd1bWVudCBpcyBpbnRlbmRlZCBmb3IgaW50ZXJhbCB1c2Ugb25seS5cbiAgICAqIEByZXR1cm4ge1Byb21pc2V9IC0gYSBwcm9taXNlIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aGVuIGFsbCBwYWdlcyBoYXZlIGJlZW4gZmV0Y2hlZFxuICAgICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIGZvbGRlZCBpbnRvIHtAbGluayBSZXF1ZXN0YWJsZSNfcmVxdWVzdH0gaW4gdGhlIDIuMCByZWxlYXNlLlxuICAgICovXG4gICBfcmVxdWVzdEFsbFBhZ2VzKHBhdGgsIG9wdGlvbnMsIGNiLCByZXN1bHRzKSB7XG4gICAgICByZXN1bHRzID0gcmVzdWx0cyB8fCBbXTtcblxuICAgICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ0dFVCcsIHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGxldCB0aGlzR3JvdXA7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICB0aGlzR3JvdXAgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5kYXRhLml0ZW1zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgIHRoaXNHcm91cCA9IHJlc3BvbnNlLmRhdGEuaXRlbXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgY2Fubm90IGZpZ3VyZSBvdXQgaG93IHRvIGFwcGVuZCAke3Jlc3BvbnNlLmRhdGF9IHRvIHRoZSByZXN1bHQgc2V0YDtcbiAgICAgICAgICAgICAgIHRocm93IG5ldyBSZXNwb25zZUVycm9yKG1lc3NhZ2UsIHBhdGgsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCguLi50aGlzR3JvdXApO1xuXG4gICAgICAgICAgICBjb25zdCBuZXh0VXJsID0gZ2V0TmV4dFBhZ2UocmVzcG9uc2UuaGVhZGVycy5saW5rKTtcbiAgICAgICAgICAgIGlmIChuZXh0VXJsICYmICEob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5wYWdlICE9PSAnbnVtYmVyJykpIHtcbiAgICAgICAgICAgICAgIGxvZyhgZ2V0dGluZyBuZXh0IHBhZ2U6ICR7bmV4dFVybH1gKTtcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0QWxsUGFnZXMobmV4dFVybCwgb3B0aW9ucywgY2IsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgIGNiKG51bGwsIHJlc3VsdHMsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3VsdHM7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICB9KS5jYXRjaChjYWxsYmFja0Vycm9yT3JUaHJvdyhjYiwgcGF0aCkpO1xuICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RhYmxlO1xuXG4vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyAvL1xuLy8gIFByaXZhdGUgaGVscGVyIGZ1bmN0aW9ucyAgLy9cbi8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIC8vXG5jb25zdCBNRVRIT0RTX1dJVEhfTk9fQk9EWSA9IFsnR0VUJywgJ0hFQUQnLCAnREVMRVRFJ107XG5mdW5jdGlvbiBtZXRob2RIYXNOb0JvZHkobWV0aG9kKSB7XG4gICByZXR1cm4gTUVUSE9EU19XSVRIX05PX0JPRFkuaW5kZXhPZihtZXRob2QpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TmV4dFBhZ2UobGlua3NIZWFkZXIgPSAnJykge1xuICAgY29uc3QgbGlua3MgPSBsaW5rc0hlYWRlci5zcGxpdCgvXFxzKixcXHMqLyk7IC8vIHNwbGl0cyBhbmQgc3RyaXBzIHRoZSB1cmxzXG4gICByZXR1cm4gbGlua3MucmVkdWNlKGZ1bmN0aW9uKG5leHRVcmwsIGxpbmspIHtcbiAgICAgIGlmIChsaW5rLnNlYXJjaCgvcmVsPVwibmV4dFwiLykgIT09IC0xKSB7XG4gICAgICAgICByZXR1cm4gKGxpbmsubWF0Y2goLzwoLiopPi8pIHx8IFtdKVsxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRVcmw7XG4gICB9LCB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBjYWxsYmFja0Vycm9yT3JUaHJvdyhjYiwgcGF0aCkge1xuICAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZXIob2JqZWN0KSB7XG4gICAgICBsZXQgZXJyb3I7XG4gICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KCdjb25maWcnKSkge1xuICAgICAgICAgY29uc3Qge3Jlc3BvbnNlOiB7c3RhdHVzLCBzdGF0dXNUZXh0fSwgY29uZmlnOiB7bWV0aG9kLCB1cmx9fSA9IG9iamVjdDtcbiAgICAgICAgIGxldCBtZXNzYWdlID0gKGAke3N0YXR1c30gZXJyb3IgbWFraW5nIHJlcXVlc3QgJHttZXRob2R9ICR7dXJsfTogXCIke3N0YXR1c1RleHR9XCJgKTtcbiAgICAgICAgIGVycm9yID0gbmV3IFJlc3BvbnNlRXJyb3IobWVzc2FnZSwgcGF0aCwgb2JqZWN0KTtcbiAgICAgICAgIGxvZyhgJHttZXNzYWdlfSAke0pTT04uc3RyaW5naWZ5KG9iamVjdC5kYXRhKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICBlcnJvciA9IG9iamVjdDtcbiAgICAgIH1cbiAgICAgIGlmIChjYikge1xuICAgICAgICAgbG9nKCdnb2luZyB0byBlcnJvciBjYWxsYmFjaycpO1xuICAgICAgICAgY2IoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGxvZygndGhyb3dpbmcgZXJyb3InKTtcbiAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgfTtcbn1cbiJdfQ==
//# sourceMappingURL=Requestable.js.map

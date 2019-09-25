import { CancelToken } from 'axios'

function createRequestKey(url, params) {
  let requestKey = url;
  if (params) {
    requestKey += `:${createStringFromParameters(params)}`
  }
  return requestKey;
}

function createStringFromParameters(obj) {
  const keysArr = [];
  for (const key in obj) {
    keysArr.push(key);
    if (_.isPlainObject(obj[key])) {
      keysArr.push(createStringFromParameters(obj[key]));
    }
  }
  return keysArr.join('|');
}

function createCancelMessage(requestKey, paramsStr) {
  return {
    statusCode: 100,
    requestKey: requestKey,
    message: `Request canceled: ${requestKey}`,
    paramsStr: paramsStr
  }
}

export default function ({ $axios, app }) {

  $axios.activeRequests = {};

  $axios.onRequest((config) => {
    let blockerConfigContainer = config
    <% if (options.headerBlockerKey) { %>
      if (config.headers.hasOwnProperty('<%= options.headerBlockerKey %>')) {
        blockerConfigContainer = config.headers['<%= options.headerBlockerKey %>'];
        delete config.headers['<%= options.headerBlockerKey %>'];
      }
    <% } %>

    let requestBlockingAllowed = blockerConfigContainer.blockAllowed;
    if (requestBlockingAllowed === undefined) {
      requestBlockingAllowed = <%= options.blockByDefault %>;
    }
    if (!requestBlockingAllowed) {
      return config;
    }

    //Check if user has set a custom requestKey
    let { requestKey } = blockerConfigContainer;
    if (!requestKey) {
      //If there is no custom requestKey, create a default requestKey based on url and parameters
      requestKey = createRequestKey(config.baseURL + config.url, config.params);
    }
    const paramsStr = JSON.stringify(config.params);
    //If another request with the same requestKey already exists, cancel it
    if ($axios.activeRequests.hasOwnProperty(requestKey) && $axios.activeRequests[requestKey].cancelToken) {
      $axios.activeRequests[requestKey].cancelToken.cancel(createCancelMessage(requestKey, paramsStr));
    }
    if (!$axios.hasOwnProperty(requestKey)) {
      //If request has not been sent before, create a custom promise
      let reqResolve, reqReject;
      const promise = new Promise((resolve, reject) => {
        reqResolve = resolve;
        reqReject = reject;
      });
      //Insert current request to activeRequests
      $axios.activeRequests[requestKey] = {
        promise: promise,
        resolve: reqResolve,
        reject: reqReject
      }
    }
    //Update the active request's params
    $axios.activeRequests[requestKey].paramsStr = paramsStr;
    //Create a cancel token for current request
    const cancelToken = CancelToken.source();
    $axios.activeRequests[requestKey].cancelToken = cancelToken;
    //Add the cancel token to the request
    return {
      ...config,
      cancelToken: cancelToken && cancelToken.token
    };
  });

  $axios.onError((err) => {
    //Check if error message has a requestKey set in active requests
    if (err.hasOwnProperty('message') && err.message.hasOwnProperty('requestKey') && $axios.activeRequests.hasOwnProperty(err.message.requestKey)) {
      const currentRequest = $axios.activeRequests[err.message.requestKey];
      //Check if error concerns a cancellation
      if (err.message && err.message.statusCode === 100 && currentRequest && currentRequest.paramsStr === err.message.paramsStr) {
        //Handle the cancellation error
        <% if (options.debug) { %>
          // eslint-disable-next-line no-console
          console.warn(err.message.message);
        <% } %>
        //Return a promise to the active request that overrides the current one
        return $axios.activeRequests[err.message.requestKey].promise;
      }
    }
    return Promise.reject(err);
  });

  $axios.onResponse((response) => {
    //Check if user has set a custom requestKey
    let { requestKey } = response.config;
    if (!requestKey) {
      //If there is no custom requestKey, create a default requestKey based on url and parameters
      requestKey = createRequestKey(response.config.url, response.config.params);
    }
    if ($axios.activeRequests.hasOwnProperty(requestKey)) {
      //Inform all previously cancelled requests with the current response & remove requestKey from activeRequests
      $axios.activeRequests[requestKey].resolve(response);
      delete $axios.activeRequests[requestKey];
    }
  });

  <% if (options.onPageChange) { %>
    app.router.beforeEach((to, from, next) => {
      for (const requestKey in $axios.activeRequests) {
        $axios.activeRequests[requestKey].cancelToken.cancel(createCancelMessage(requestKey));
        delete $axios.activeRequests[requestKey];
      }
      next();
    });
  <% } %>
}

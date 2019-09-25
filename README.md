# nuxt-axios-duplicate-blocker

> Nuxt module that adds [axios](https://www.npmjs.com/package/@nuxtjs/axios) interceptors in order to block duplicate API requests and return results from the latest request to all callee functions. It can also be optionally used to cancel active requests when switching between pages.

## How it works
Using axios [interceptors](https://github.com/axios/axios#interceptors), each axios request generates a ``requestKey`` that serves as an Identifier for this request. By default this ``requestKey`` is based on its url and parameter **names** (not values). You can also specify your own ``requestKey`` if the default does not suit your needs (see [Axios Request Configuration Options](#axios-request-configuration-options) bellow)

When a *new* request is made that has the same ``requestKey`` with an *active* request, the *active* request is canceled returning a promise pointing to the new request. When that request finishes it resolves the promise, so all previously canceled requests now return the latest results back to their caller functions.

Also, all active requests are cancelled by default when switching between pages. You can change this behaviour from the module options (see [Module Options](#module-options) bellow)

## Setup
- Add `nuxt-axios-duplicate-blocker` dependency to your project using yarn or npm
- Add `nuxt-axios-duplicate-blocker` to `modules` section of `nuxt.config.js`

:exclamation: **IMPORTANT:** Add it **BEFORE** including the ```axios``` module in ```nuxt.config.js```

```js
{
  modules: [
    // Simple usage
    'nuxt-axios-duplicate-blocker',

    // With options
    ['nuxt-axios-duplicate-blocker', { /* module options */ }],
    
    // Axios module must be added AFTER 'nuxt-axios-duplicate-blocker'
    '@nuxtjs/axios'
 ]
}
```
## Module Options
Option | Type | Default | Description
--- | --- | --- | ---
debug | Boolean | ```this.options.dev``` <br>(```true``` for development ```false``` for production) | If set to true it will always show a warning in console whenever a request has been blocked.
onPageChange | Boolean | ```true``` | If set to true **all** active API requests will be canceled when switching pages.
blockByDefault | Boolean | ```true``` | Sets the default policy for blocking requests. If set to true all requests will be blocked unless specified otherwise in the [request configuration](#axios-request-configuration-options) of a call with the ```blockAllowed``` option.
headerBlockerKey | String | ```<empty>``` | Set the key in headers section of Axios's request configuration, to be used as the container of the [request configuration options](#axios-request-configuration-options) for this module. Read the [important note](#exclamation-important-note) below for more details.

## Axios Request Configuration Options

:exclamation: Please read the [note](#exclamation-important-note) below if these options do not work.

Option | Type | Default | Description
--- | --- | --- | ---
requestKey | String | ```url```:```parameterName1```&#124;```parameterName2```&#124;```...``` | You can *optionally* provide a custom request key for specifying requests that should not block each other by adding an ID to a configuration object for an axios call.
blockAllowed | Boolean | ```true``` | You can *optionally* use this parameter to override the default policy for blocking requests, set in [module options](#module-options) with ```blockByDefault```.

Example:
``` js
await this.$axios.$get('/example-api/example', {
    params: { ... },
    requestKey: 'customRequestKeyName',
    blockAllowed: false
});
```
#### :exclamation: IMPORTANT NOTE
In version 0.19.0, axios module introduced a breaking change that disallows extra parameters to be added in the request configuration object. There is a ticket about this issue [here](https://github.com/axios/axios/issues/2203) and a [fix](https://github.com/axios/axios/pull/2207) but it has not been officially released by the time of this writing.

Until the official release of this fix, in order to make the **custom request options** for this module work again, you must set the ```headerBlockerKey``` property in [Module Options](#module-options) to a string that will be used for passing them as a property in the headers section of the [Request Configuration Options](#axios-request-configuration-options). **This property will be deleted from the headers section before the request is sent.**

Example:

In ```nuxt.config.js```
```js
{
  modules: [
    ['nuxt-axios-duplicate-blocker', {
        headerBlockerKey: 'blocker'
    }]
 ]
}
```
In the axios call:
``` js
await this.$axios.$get('/example-api/example', {
    params: { ... },
    headers: { 
        blocker: {
            requestKey: 'customRequestKeyName',
            blockAllowed: false
        }
    }
});
```

This feature will be removed in the next [major release](https://docs.npmjs.com/about-semantic-versioning#incrementing-semantic-versions-in-published-packages) of this module so use the ```^``` sign, in your package.json dependency in order to avoid compatibility issues.
## License

[MIT License](./LICENSE)

Copyright (c) Marios Vertopoulos

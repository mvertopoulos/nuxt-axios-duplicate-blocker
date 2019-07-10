# nuxt-axios-duplicate-blocker

> Nuxt module that adds [axios](https://www.npmjs.com/package/@nuxtjs/axios) interceptors in order to block duplicate API requests
 and return results from the latest request to all callee functions. It can also be optionally used to cancel active 
 requests when switching between pages.

## How it works
Using axios [interceptors](https://github.com/axios/axios#interceptors), each axios request generates a ``requestKey``
that serves as an Identifier for this request. By default this ``requestKey`` is based on its url and 
parameter **names** (not values). You can also specify your own ``requestKey`` if the default does not suit your needs 
(see [Axios Request Configuration Options](#axios-request-configuration-options) bellow)

When a *new* request is made that has the same ``requestKey`` with an *active* request,
the *active* request is canceled returning a promise pointing to the new request. When that request finishes it resolves
the promise, so all previously canceled requests now return the latest results back to their caller functions.

Also, all active requests are cancelled by default when switching between pages. You can change this behaviour from the
module options (see [Module Options](#module-options) bellow)

## Setup
- Add `nuxt-axios-duplicate-blocker` dependency using yarn or npm to your project
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

## Axios Request Configuration Options
Option | Type | Default | Description
--- | --- | --- | ---
requestKey | String | ```url```:```parameterName1```&#124;```parameterName2```&#124;```...``` | You can *optionally* provide a custom request key for specifying requests that should not block each other by adding an ID to a configuration object for an axios call.

Example:
``` js
await this.$axios.$get('/example-api/example', {
    params: { ... },
    requestKey: 'customRequestKeyName'
});
```

## License

[MIT License](./LICENSE)

Copyright (c) Marios Vertopoulos

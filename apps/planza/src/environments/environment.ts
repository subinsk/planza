// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseURL: 'http://localhost:4200',
  api: 'http://localhost:3333/api',
  auth: {
    // Auth config will be loaded at runtime via ConfigService
    // NO SECRETS should be hardcoded here
    audience: 'https://planza.app/api',
    domain: '',
    clientId: '',
    redirectUri: window.location.origin + '/auth/callback',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error'; // Included with Angular CLI.


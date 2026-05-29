// https://www.i18next.com/overview/typescript
// import the original type declarations
import 'i18next';
// import all namespaces (for the default language, only)
import admin from '../../public/locales/en/admin.json'
import shared from '../../public/locales/en/shared.json'
import user from '../../public/locales/en/user.json'

declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: 'shared';
    // custom resources type
    resources: {
      admin: typeof admin;
      shared: typeof shared;
      user: typeof user;
    };
  }
}
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ko'],
}

export type Locale = (typeof i18n)['locales'][number]

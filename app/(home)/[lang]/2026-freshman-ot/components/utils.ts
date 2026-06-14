import { Locale } from '@/i18n-config'

export type I18nText = { ko: string; en: string }

export const getLocalizedText = (lang: Locale, text: I18nText) => text[lang]

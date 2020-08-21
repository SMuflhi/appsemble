import langs from 'langmap';
import type { LanguageMappingList } from 'langmap/types';

// Exclude languages that aren’t accepted by our server and store language codes in lowercase.
const bannedLanguages = new Set([
  'ck-US',
  'en-PI',
  'en-UD',
  'en@pirate',
  'eo-EO',
  'fb-LT',
  'gx-GR',
]);

export const langmap = Object.fromEntries(
  Object.entries(langs)
    .filter(([key]) => !bannedLanguages.has(key))
    .map(([key, entry]) => [key.toLowerCase(), entry]),
) as LanguageMappingList;

export function getLanguageDisplayName(language: string): string {
  const { englishName, nativeName } = langmap[language];
  return englishName === nativeName ? englishName : `${englishName} (${nativeName})`;
}

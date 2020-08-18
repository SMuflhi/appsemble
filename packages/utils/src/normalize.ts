/**
 * Turn a string into a URL friendly variant by stripping any weird formatting.
 *
 * - Accents are stripped;
 * - Whitespace is replaced with a hyphen;
 * - The resulting string is lower case.
 *
 * @param input - The input string to normalize.
 * @param stripTrailingHyphen - Strip a trailing hyphen. Disable for example when processing user
 * input directly while the user is typing.
 *
 * @returns The normalized string.
 */
export function normalize(input: string, stripTrailingHyphen = true): string {
  const normalized = input
    // Normalize accents. https://stackoverflow.com/a/37511463/1154610
    .normalize('NFD')
    // Replace any white space with hyphens.
    .replace(/[\s._-]+/g, '-')
    // Strip off any non-word / hyphen characters.
    .replace(/((?!([\w-]+)).)|^-/g, '')
    // Make it lower case.
    .toLowerCase();
  return stripTrailingHyphen ? normalized.replace(/-$/, '') : normalized;
}

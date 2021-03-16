/**
 * A post-processed MDX markdown document.
 */
declare module '*.md' {
  import { IconName } from '@fortawesome/fontawesome-common-types';
  import { FC } from 'react';

  /**
   * The MDX document as a React component.
   */
  const mdxComponent: FC;
  export default mdxComponent;

  /**
   * An icon for the document.
   */
  export const icon: IconName | undefined;

  /**
   * The level page header of the document as a string.
   */
  export const title: string;
}

/**
 * A post-processed MDX document.
 */
declare module '*.mdx' {
  export * from '*.md';
}
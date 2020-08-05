import React, { ReactElement } from 'react';

/**
 * Render an MDX pre element.
 *
 * This is needed to prevent MDX from rendering a nested `<pre />` element for code blocks.
 */
export default function MDXPre(props: any): ReactElement {
  return <div {...props} />;
}

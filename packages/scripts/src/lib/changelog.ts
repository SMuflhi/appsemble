import { promises as fs } from 'fs';

// eslint-disable-next-line import/no-extraneous-dependencies
import { Text } from 'mdast';
import fromMarkdown from 'mdast-util-from-markdown';
import toMarkdown from 'mdast-util-to-markdown';
import visit from 'unist-util-visit';

/**
 * Get the release notes for the latest release.
 *
 * @returns The release notes for the last version
 */
export async function getReleaseNotes(): Promise<string> {
  const changelog = await fs.readFile('CHANGELOG.md', 'utf-8');
  const ast = fromMarkdown(changelog);
  let sectionStart: number;
  let sectionEnd: number;
  for (const [index, child] of ast.children.entries()) {
    if (child.type !== 'heading' || child.depth !== 2) {
      continue;
    }
    if (sectionStart) {
      sectionEnd = index;
      break;
    } else {
      sectionStart = index;
    }
  }
  ast.children.splice(sectionEnd);
  ast.children.splice(0, sectionStart + 1);
  visit<Text>(ast, 'text', (node) => {
    // eslint-disable-next-line no-param-reassign
    node.value = node.value.replace(/\n+/g, (match) => (match.length === 1 ? ' ' : '\n\n'));
  });
  return toMarkdown(ast, { bullet: '-', listItemIndent: 'one', strong: '_' });
}

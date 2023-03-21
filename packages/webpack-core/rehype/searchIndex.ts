import { valueToEstree } from 'estree-util-value-to-estree';
import { Element, Root, RootContent } from 'hast';
import { toText } from 'hast-util-to-text';
import 'mdast-util-mdx';
import { Plugin, Transformer } from 'unified';

const transformer: Transformer<Root> = (ast) => {
  const sections: [string, { title: string; haystack: string }][] = [];
  let section: RootContent[] = [];
  let heading: Element;

  for (const child of ast.children) {
    if (child.type === 'text') {
      section.push(child);
    }

    if (child.type !== 'element') {
      continue;
    }

    if (child.properties?.id) {
      if (heading && child.properties.id) {
        sections.push([
          heading.properties.id as string,
          {
            title: toText(heading),
            haystack: toText({ type: 'root', children: section }),
          },
        ]);
      }

      heading = child;
      section = [];
    }

    section.push(child);
  }

  ast.children.unshift({
    type: 'mdxjsEsm',
    value: '',
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExportNamedDeclaration',
            specifiers: [],
            declaration: {
              type: 'VariableDeclaration',
              kind: 'const',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'searchIndex' },
                  init: valueToEstree(sections),
                },
              ],
            },
          },
        ],
      },
    },
  });
};

export const rehypeSearchIndex: Plugin<[], Root> = () => transformer;

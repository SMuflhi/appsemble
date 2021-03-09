import { editor } from 'monaco-editor';
import { ReactElement, useEffect, useRef } from 'react';

import styles from './index.module.css';

interface CodeBlockProps {
  /**
   * A class name to add to the `div` element.
   */
  className?: string;

  /**
   * The code to use as the original code before modification.
   */
  original: string;

  /**
   * Modified version of the code.
   */
  modified: string;

  /**
   * The language to use for highlighting the code.
   */
  language: string;
}

/**
 * Render a code diff block using syntax highlighting based on Monaco editor.
 */
export function CodeDiffBlock({
  className,
  language,
  modified,
  original,
}: CodeBlockProps): ReactElement {
  const ref = useRef();

  useEffect(() => {
    let dispose: () => void;
    if (language) {
      const ed = editor.createDiffEditor(ref.current, {
        enableSplitViewResizing: false,
        renderSideBySide: false,
        minimap: { enabled: false },
        readOnly: true,
      });
      ed.setModel({
        original: editor.createModel(original, language),
        modified: editor.createModel(modified, language),
      });
    }

    return () => {
      if (dispose) {
        dispose();
      }
    };
  }, [original, language, modified]);

  return <div className={`${className} ${styles.diff}`} ref={ref} />;
}

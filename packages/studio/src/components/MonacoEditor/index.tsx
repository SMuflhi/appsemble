import { applyRefs } from '@appsemble/react-components';
import classNames from 'classnames';
import { editor, IDisposable, KeyCode, KeyMod, Uri } from 'monaco-editor/esm/vs/editor/editor.api';
import { forwardRef, useEffect, useRef, useState } from 'react';

import './custom';
import { Diagnostic } from './Diagnostic';
import styles from './index.module.css';

editor.setTheme('vs');

interface MonacoEditorProps {
  /**
   * A class name to apply to the monaco editor element.
   */
  className?: string;

  /**
   * The current value of the editor.
   */
  value?: string;

  /**
   * The language of the editor.
   */
  language: string;

  /**
   * This is called whenever the value of the editor changes.
   *
   * @param event - The monaco change event.
   * @param value - The new value.
   * @param model - The monaco model which changed.
   */
  onChange?: (
    event: editor.IModelContentChangedEvent,
    value: string,
    model: editor.ITextModel,
  ) => void;

  /**
   * Called when Ctrl-S is pressed.
   */
  onSave?: () => void;

  /**
   * Whether or not the editor is on read-only mode.
   */
  readOnly?: boolean;

  /**
   * If true, render editor diagnostics in a pane below the editor.
   */
  showDiagnostics?: boolean;

  /**
   * The filename of the resource.
   */
  uri: string;
}

/**
 * Render a Monaco standalone editor instance.
 *
 * The forwarded ref might not trigger a rerender of the parent component. Instead of passing a ref
 * object, it is recommended to use a state setter function.
 */
export const MonacoEditor = forwardRef<editor.IStandaloneCodeEditor, MonacoEditorProps>(
  (
    { className, language, onChange, onSave, readOnly = false, showDiagnostics, uri, value = '' },
    ref,
  ) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor>();

    const [markers, setMarkers] = useState<editor.IMarker[]>([]);

    /**
     * Cleanup the editor itself.
     */
    useEffect(() => () => editorRef.current.dispose(), []);

    /**
     * Update options if they change.
     */
    useEffect(() => {
      editorRef.current?.updateOptions({ readOnly });
    }, [readOnly]);

    /**
     * Set a new model if either the language or the uri changes.
     */
    useEffect(() => {
      const ed = editorRef.current;
      if (!ed) {
        return;
      }

      const model = editor.createModel('', language, Uri.parse(uri));
      ed.setModel(model);

      return () => model.dispose();
    }, [language, uri]);

    /**
     * Update the model value if it changes.
     */
    useEffect(() => {
      const model = editorRef.current?.getModel();

      // Without this check undo and redo don’t work.
      if (model && model.getValue() !== value) {
        model.setValue(value);
      }
    }, [value]);

    /**
     * Handle the change handler.
     */
    useEffect(() => {
      const ed = editorRef.current;
      if (!ed || !onChange) {
        return;
      }

      // Keep track of the latest content change handler disposable.
      let contentDisposable: IDisposable;

      // Dispose the old handler if it exists, and register a new one if the model could be
      // resolved.
      const registerHandler = (model: editor.ITextModel | null): void => {
        contentDisposable?.dispose();
        contentDisposable = model
          ? model.onDidChangeContent((event) => onChange(event, model.getValue(), model))
          : undefined;
      };

      // Register a handler for the current model.
      registerHandler(ed.getModel());
      const modelDisposable = ed.onDidChangeModel(() => {
        // And update it when the model changes.
        registerHandler(ed.getModel());
      });

      return () => {
        // Cleanup all disposables.
        contentDisposable?.dispose();
        modelDisposable.dispose();
      };
    }, [onChange]);

    /**
     * Manage the CTRL+S key binding for saving
     */
    useEffect(() => {
      const ed = editorRef.current;
      if (!ed) {
        return;
      }

      const disposable = ed.addAction({
        // The same values are used as in VS Code
        id: 'workbench.action.files.save',
        label: 'File: Save',
        keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
        run() {
          onSave();
        },
      });

      return () => disposable.dispose();
    }, [onSave]);

    /**
     * Update the markers when they change.
     */
    useEffect(() => {
      const ed = editorRef.current;
      if (!ed) {
        return;
      }

      const disposable = editor.onDidChangeMarkers((resources) => {
        const modelUri = String(ed.getModel().uri);
        for (const resource of resources) {
          if (String(resource) === modelUri) {
            setMarkers(editor.getModelMarkers({ resource }));
            break;
          }
        }
      });

      return () => disposable.dispose();
    }, []);

    return (
      <div className={classNames('is-flex is-flex-direction-column', className)}>
        <div
          className="is-flex-grow-1 is-flex-shrink-1"
          ref={(node) => {
            if (!editorRef.current) {
              applyRefs(
                editor.create(node, {
                  automaticLayout: true,
                  insertSpaces: true,
                  minimap: { enabled: false },
                  readOnly,
                  tabSize: 2,
                }),
                editorRef,
                ref,
              );
            }
          }}
        />
        {showDiagnostics ? (
          <div className={`is-flex-grow-1 is-flex-shrink-1 ${styles.diagnostics}`}>
            {markers.map((marker) => (
              <Diagnostic
                key={`${marker.code}-${marker.startLineNumber}-${marker.startColumn}-${marker.endLineNumber}-${marker.endColumn}`}
                marker={marker}
                monaco={editorRef.current}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);

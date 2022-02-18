import {
  Button,
  Tabs,
  useBeforeUnload,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { App, AppDefinition } from '@appsemble/types';
import { getAppBlocks } from '@appsemble/utils';
import axios from 'axios';
import equal from 'fast-deep-equal';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { parse } from 'yaml';

import { useApp } from '..';
import { AppPreview } from '../../../../components/AppPreview';
import { MonacoEditor } from '../../../../components/MonacoEditor';
import { getCachedBlockVersions } from '../../../../components/MonacoEditor/appValidation';
import { getAppUrl } from '../../../../utils/getAppUrl';
import { EditorTab } from './EditorTab';
import styles from './index.module.css';
import { messages } from './messages';

export default function EditPage(): ReactElement {
  useMeta(messages.title);

  const { app, setApp } = useApp();
  const { id } = app;

  const [appDefinition, setAppDefinition] = useState<string>(app.yaml);
  const { data: coreStyle, setData: setCoreStyle } = useData<string>(`/api/apps/${id}/style/core`);
  const { data: sharedStyle, setData: setSharedStyle } = useData<string>(
    `/api/apps/${id}/style/shared`,
  );

  const [appDefinitionErrorCount, setAppDefinitionErrorCount] = useState(0);
  const [coreStyleErrorCount, setCoreStyleErrorCount] = useState(0);
  const [sharedStyleErrorCount, setSharedStyleErrorCount] = useState(0);

  const [pristine, setPristine] = useState(true);

  const frame = useRef<HTMLIFrameElement>();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const history = useHistory();
  const push = useMessages();

  const changeTab = useCallback((event, hash: string) => history.push({ hash }), [history]);

  const onSave = useCallback(async () => {
    const definition = parse(appDefinition) as AppDefinition;

    const blockManifests = await getCachedBlockVersions(getAppBlocks(definition));

    // YAML and schema appear to be valid, send it to the app preview iframe
    delete definition.anchors;
    frame.current?.contentWindow.postMessage(
      { type: 'editor/EDIT_SUCCESS', definition, blockManifests, coreStyle, sharedStyle },
      getAppUrl(app.OrganizationId, app.path),
    );
  }, [app, appDefinition, coreStyle, sharedStyle]);

  useBeforeUnload(appDefinition !== app.yaml);

  const uploadApp = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('yaml', appDefinition);
      formData.append('coreStyle', coreStyle);
      formData.append('sharedStyle', sharedStyle);

      const { data } = await axios.patch<App>(`/api/apps/${id}`, formData);
      push({ body: formatMessage(messages.updateSuccess), color: 'success' });

      // Update App State
      setApp(data);
    } catch {
      push(formatMessage(messages.errorUpdate));
    }
  }, [appDefinition, coreStyle, formatMessage, id, push, setApp, sharedStyle]);

  const promptUpdateApp = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.publish} />,
    action: uploadApp,
    color: 'warning',
  });

  const onUpload = useCallback(async () => {
    const newApp = parse(appDefinition, { maxAliasCount: 10_000 }) as AppDefinition;

    if (!equal(newApp.resources, app.definition.resources)) {
      promptUpdateApp();
      return;
    }

    await uploadApp();
  }, [appDefinition, app, uploadApp, promptUpdateApp]);

  const onMonacoChange = useCallback(
    (event, value: string, model: editor.ITextModel) => {
      switch (String(model.uri)) {
        case 'file:///app.yaml': {
          setAppDefinition(value);
          break;
        }
        case 'file:///core.css':
          setCoreStyle(value);
          break;
        case 'file:///shared.css':
          setSharedStyle(value);
          break;
        default:
          break;
      }

      setPristine(false);
    },
    [setCoreStyle, setSharedStyle],
  );

  useEffect(() => {
    const disposable = editor.onDidChangeMarkers((resources) => {
      for (const resource of resources) {
        const { length } = editor.getModelMarkers({ resource });
        switch (String(resource)) {
          case 'file:///app.yaml':
            setAppDefinitionErrorCount(length);
            break;
          case 'file:///core.css':
            setCoreStyleErrorCount(length);
            break;
          case 'file:///shared.css':
            setSharedStyleErrorCount(length);
            break;
          default:
            break;
        }
      }
    });

    return () => disposable.dispose();
  }, []);

  const monacoProps =
    location.hash === '#editor'
      ? { language: 'yaml', uri: 'app.yaml', value: appDefinition }
      : location.hash === '#style-core'
      ? { language: 'css', uri: 'core.css', value: coreStyle }
      : location.hash === '#style-shared'
      ? { language: 'css', uri: 'shared.css', value: sharedStyle }
      : undefined;

  if (!monacoProps) {
    return <Redirect to={{ ...location, hash: '#editor' }} />;
  }

  const disabled = Boolean(
    pristine ||
      app.locked ||
      appDefinitionErrorCount ||
      coreStyleErrorCount ||
      sharedStyleErrorCount,
  );

  return (
    <div className={`${styles.root} is-flex`}>
      <div className={`is-flex is-flex-direction-column ${styles.leftPanel}`}>
        <div className="buttons">
          <Button disabled={disabled} icon="vial" onClick={onSave}>
            <FormattedMessage {...messages.preview} />
          </Button>
          <Button disabled={disabled} icon="save" onClick={onUpload}>
            <FormattedMessage {...messages.publish} />
          </Button>
          <Button
            component="a"
            href={getAppUrl(app.OrganizationId, app.path, app.domain)}
            icon="share-square"
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.viewLive} />
          </Button>
        </div>
        <Tabs boxed className="mb-0" onChange={changeTab} value={location.hash}>
          <EditorTab errorCount={appDefinitionErrorCount} icon="file-code" value="#editor">
            <FormattedMessage {...messages.app} />
          </EditorTab>
          <EditorTab errorCount={coreStyleErrorCount} icon="brush" value="#style-core">
            <FormattedMessage {...messages.coreStyle} />
          </EditorTab>
          <EditorTab errorCount={sharedStyleErrorCount} icon="brush" value="#style-shared">
            <FormattedMessage {...messages.sharedStyle} />
          </EditorTab>
        </Tabs>
        <div className={styles.editorForm}>
          <MonacoEditor
            className={styles.editor}
            onChange={onMonacoChange}
            onSave={onSave}
            readOnly={app.locked}
            showDiagnostics
            {...monacoProps}
          />
        </div>
      </div>

      <AppPreview app={app} iframeRef={frame} />
    </div>
  );
}

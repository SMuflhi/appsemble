import RefParser from '@apidevtools/json-schema-ref-parser';
import {
  Button,
  CardFooterButton,
  Form,
  Icon,
  Loader,
  Modal,
  useMessages,
} from '@appsemble/react-components';
import type { AppDefinition, BlockManifest } from '@appsemble/types';
import {
  api,
  filterBlocks,
  getAppBlocks,
  SchemaValidationError,
  validate,
  validateStyle,
} from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import { safeDump, safeLoad } from 'js-yaml';
import { isEqual } from 'lodash';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';

import { useApp } from '../AppContext';
import GUIEditor, { EditLocation, GuiEditorStep } from '../GUIEditor';
import HelmetIntl from '../HelmetIntl';
import MonacoEditor from '../MonacoEditor';
import styles from './index.css';
import messages from './messages';

const openApiDocumentPromise = RefParser.dereference(api('', { host: window.location.origin }));

export default function Editor(): React.ReactElement {
  const { app, setApp } = useApp();

  const [appName, setAppName] = React.useState('');
  const [recipe, setRecipe] = React.useState<string>(null);
  const [style, setStyle] = React.useState('');
  const [sharedStyle, setSharedStyle] = React.useState('');
  const [initialRecipe, setInitialRecipe] = React.useState('');
  const [path, setPath] = React.useState('');
  const [valid, setValid] = React.useState(false);
  const [dirty, setDirty] = React.useState(true);
  const [warningDialog, setWarningDialog] = React.useState(false);
  const [openApiDocument, setOpenApiDocument] = React.useState<OpenAPIV3.Document>();

  const [editorStep, setEditorStep] = React.useState<GuiEditorStep>(GuiEditorStep.SELECT);
  const [allowEdit, setAllowEdit] = React.useState(false);
  const [allowAdd, setAllowAdd] = React.useState(false);
  const [editLocation, setEditLocation] = React.useState<EditLocation>(undefined);

  const frame = React.useRef<HTMLIFrameElement>();
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const push = useMessages();

  const appUrl = `${window.location.protocol}//${app.path}.${app.OrganizationId}.${window.location.host}`;

  React.useEffect(() => {
    openApiDocumentPromise.then(setOpenApiDocument);
  }, []);

  React.useEffect(() => {
    const { id } = params;

    if (!location.hash) {
      history.push('#editor');
    }

    const getStyles = async (): Promise<void> => {
      try {
        const { data: styleData } = await axios.get(`/api/apps/${id}/style/core`);
        const { data: sharedStyleData } = await axios.get(`/api/apps/${id}/style/shared`);

        setStyle(styleData);
        setSharedStyle(sharedStyleData);
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 401)) {
          push(intl.formatMessage(messages.appNotFound));
        } else {
          push(intl.formatMessage(messages.error));
        }
      }
    };

    getStyles();

    // Destructuring path, and organizationId also hides these technical details for the user
    const { definition, path: p } = app;
    let { yaml: yamlRecipe } = app;

    if (!yamlRecipe) {
      yamlRecipe = safeDump(definition);
      push({ body: intl.formatMessage(messages.yamlNotFound), color: 'info' });
    }

    setAppName(definition.name);
    setRecipe(yamlRecipe);
    setInitialRecipe(yamlRecipe);
    setPath(p);
  }, [app, history, intl, location.hash, params, push]);

  const onSave = React.useCallback(
    async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      let definition: AppDefinition;
      // Attempt to parse the YAML into a JSON object
      try {
        definition = safeLoad(recipe);
      } catch (error) {
        push(intl.formatMessage(messages.invalidYaml));
        setValid(false);
        setDirty(false);
        return;
      }

      try {
        validateStyle(style);
        validateStyle(sharedStyle);
      } catch (error) {
        push(intl.formatMessage(messages.invalidStyle));
        setValid(false);
        setDirty(false);
        return;
      }

      try {
        await validate(
          (openApiDocument.components.schemas.App as OpenAPIV3.SchemaObject).properties
            .definition as OpenAPIV3.SchemaObject,
          definition,
        );
        const blockManifests: Omit<BlockManifest, 'parameters'>[] = await Promise.all(
          filterBlocks(Object.values(getAppBlocks(definition))).map(async (block) => {
            const { data } = await axios.get<BlockManifest>(
              `/api/blocks/${block.type}/versions/${block.version}`,
            );
            return {
              name: data.name,
              version: data.version,
              layout: data.layout,
              files: data.files,
              actions: data.actions,
            };
          }),
        );
        setValid(true);

        // YAML and schema appear to be valid, send it to the app preview iframe
        frame.current.contentWindow.postMessage(
          { type: 'editor/EDIT_SUCCESS', definition, blockManifests, style, sharedStyle },
          appUrl,
        );
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          const errors = error.data;
          push({
            body: intl.formatMessage(messages.schemaValidationFailed, {
              properties: Object.keys(errors).join(', '),
            }),
          });
        } else {
          push(intl.formatMessage(messages.unexpected));
        }

        setValid(false);
      }
      setDirty(false);
    },
    [appUrl, intl, openApiDocument, push, recipe, sharedStyle, style],
  );

  const uploadApp = React.useCallback(async () => {
    if (!valid) {
      return;
    }

    const { id } = params;
    const definition = safeLoad(recipe);

    try {
      const formData = new FormData();
      formData.append('definition', JSON.stringify(definition));
      // The MIME type for YAML is not officially registered in IANA.
      // For the time being, x-yaml is used. See also: http://www.iana.org/assignments/media-types/media-types.xhtml
      formData.append('yaml', new Blob([recipe], { type: 'text/x-yaml' }));
      formData.append('style', new Blob([style], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));

      const { data } = await axios.patch(`/api/apps/${id}`, formData);
      setPath(data.path);
      push({ body: intl.formatMessage(messages.updateSuccess), color: 'success' });

      // update App State
      setApp(data);
    } catch (e) {
      if (e.response && e.response.status === 403) {
        push(intl.formatMessage(messages.forbidden));
      } else {
        push(intl.formatMessage(messages.errorUpdate));
      }

      return;
    }

    setAppName(definition.name);
    setDirty(true);
    setWarningDialog(false);
    setInitialRecipe(recipe);
  }, [intl, params, push, recipe, sharedStyle, style, setApp, valid]);

  const onUpload = React.useCallback(async () => {
    if (valid) {
      const newApp = safeLoad(recipe);
      const originalApp = safeLoad(initialRecipe);

      if (!isEqual(newApp.resources, originalApp.resources)) {
        setWarningDialog(true);
        return;
      }

      await uploadApp();
    }
  }, [initialRecipe, recipe, uploadApp, valid]);

  const onMonacoChange = React.useCallback(
    (value) => {
      switch (location.hash) {
        case '#editor':
          setRecipe(value);
          break;
        case '#style-core':
          setStyle(value);
          break;
        case '#style-shared':
          setSharedStyle(value);
          break;
        default:
          break;
      }

      setDirty(true);
    },
    [location.hash],
  );

  const onClose = React.useCallback(() => {
    setWarningDialog(false);
  }, []);

  if (recipe == null) {
    return <Loader />;
  }

  const onValueChange = onMonacoChange;
  let value;
  let language;

  switch (location.hash) {
    case '#style-core':
      value = style;
      language = 'css';
      break;
    case '#style-shared':
      value = sharedStyle;
      language = 'css';
      break;
    case '#editor':
    default:
      value = recipe;
      language = 'yaml';
  }

  return (
    <div className={styles.root}>
      <HelmetIntl title={messages.title} titleValues={{ name: appName }} />
      <div className={styles.leftPanel}>
        <Form className={styles.editorForm} onSubmit={onSave}>
          <nav className="navbar">
            <div className="navbar-brand">
              <span className="navbar-item">
                <Button disabled={!dirty} icon="vial" type="submit">
                  <FormattedMessage {...messages.preview} />
                </Button>
              </span>
              <span className="navbar-item">
                <Button
                  className="button"
                  disabled={!valid || dirty}
                  icon="save"
                  onClick={onUpload}
                >
                  <FormattedMessage {...messages.publish} />
                </Button>
              </span>
              <span className="navbar-item">
                <a className="button" href={appUrl} rel="noopener noreferrer" target="_blank">
                  <Icon icon="share-square" />
                  <span>
                    <FormattedMessage {...messages.viewLive} />
                  </span>
                </a>
              </span>
              <span className="navbar-item">
                <Button
                  color="primary"
                  icon="random"
                  onClick={() => {
                    if (editorStep !== GuiEditorStep.YAML) {
                      setEditorStep(GuiEditorStep.YAML);
                    } else {
                      setEditorStep(GuiEditorStep.SELECT);
                    }
                  }}
                >
                  {editorStep === GuiEditorStep.YAML ? (
                    <FormattedMessage {...messages.switchManual} />
                  ) : (
                    <FormattedMessage {...messages.switchGUI} />
                  )}
                </Button>
              </span>
            </div>
          </nav>
          <div
            className={
              editorStep === GuiEditorStep.ADD ? 'is-hidden' : `tabs is-boxed ${styles.editorTabs}`
            }
          >
            {editorStep === GuiEditorStep.YAML ? (
              <ul>
                <li
                  className={classNames({ 'is-active': location.hash === '#editor' })}
                  value="editor"
                >
                  <Link to="#editor">
                    <Icon icon="file-code" />
                    <FormattedMessage {...messages.recipe} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': location.hash === '#style-core' })}
                  value="style-core"
                >
                  <Link to="#style-core">
                    <Icon icon="brush" />
                    <FormattedMessage {...messages.coreStyle} />
                  </Link>
                </li>
                <li
                  className={classNames({ 'is-active': location.hash === '#style-shared' })}
                  value="style-shared"
                >
                  <Link to="#style-shared">
                    <Icon icon="brush" />
                    <FormattedMessage {...messages.sharedStyle} />
                  </Link>
                </li>
              </ul>
            ) : (
              <ul>
                <li
                  className={classNames({ 'is-active': location.hash === '#editor' })}
                  value="editor"
                >
                  <Link to="#editor">
                    <Icon icon="file-code" />
                    <FormattedMessage {...messages.recipe} />
                  </Link>
                </li>
                <li value="addblock">
                  <Button
                    color="success"
                    disabled={!allowAdd}
                    icon="plus"
                    onClick={() => setEditorStep(GuiEditorStep.ADD)}
                  >
                    <FormattedMessage {...messages.addBlock} />
                  </Button>
                </li>
                <li value="editblock">
                  <Button
                    className={styles.guiEditorButton}
                    color="warning"
                    disabled={!allowEdit}
                    icon="edit"
                    onClick={() => setEditorStep(GuiEditorStep.EDIT)}
                  >
                    <FormattedMessage {...messages.editBlock} />
                    {editLocation?.blockName ? editLocation.blockName : ''}
                  </Button>
                </li>
                <li value="removeblock">
                  <Button
                    className={styles.guiEditorButton}
                    color="danger"
                    disabled={!allowEdit}
                    icon="trash-alt"
                    onClick={() => setEditorStep(GuiEditorStep.DELETE)}
                  >
                    <FormattedMessage {...messages.deleteBlock} />
                    {editLocation?.blockName ? editLocation.blockName : ''}
                  </Button>
                </li>
              </ul>
            )}
          </div>
          {editorStep !== GuiEditorStep.YAML ? (
            <GUIEditor
              app={app}
              editLocation={editLocation}
              editorStep={editorStep}
              save={onSave}
              setAllowAdd={(allow: boolean) => setAllowAdd(allow)}
              setAllowEdit={(allow: boolean) => setAllowEdit(allow)}
              setEditLocation={setEditLocation}
              setEditorStep={(step: GuiEditorStep) => setEditorStep(step)}
              setRecipe={setRecipe}
            />
          ) : (
            <MonacoEditor
              language={language}
              onSave={onSave}
              onValueChange={onValueChange}
              value={value}
            />
          )}
          <Modal
            footer={
              <>
                <CardFooterButton onClick={onClose}>
                  <FormattedMessage {...messages.cancel} />
                </CardFooterButton>
                <CardFooterButton color="warning" onClick={uploadApp}>
                  <FormattedMessage {...messages.publish} />
                </CardFooterButton>
              </>
            }
            isActive={warningDialog}
            onClose={onClose}
            title={<FormattedMessage {...messages.resourceWarningTitle} />}
          >
            <FormattedMessage {...messages.resourceWarning} />
          </Modal>
        </Form>
      </div>

      <div className={styles.rightPanel}>
        {path && (
          <iframe
            ref={frame}
            className={styles.appFrame}
            src={appUrl}
            title={intl.formatMessage(messages.iframeTitle)}
          />
        )}
      </div>
    </div>
  );
}

import {
  Button,
  CardFooterButton,
  Checkbox,
  Dropdown,
  Form,
  ModalCard,
  useConfirmation,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import { NamedEvent } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { OpenAPIV3 } from 'openapi-types';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { Resource, RouteParams } from '..';
import { useApp } from '../../../..';
import { JSONSchemaEditor } from '../../../../../../../components/JSONSchemaEditor';
import { ClonableCheckbox } from '../ClonableCheckbox';
import { ResourceCell } from '../ResourceCell';
import styles from './index.module.css';
import { messages } from './messages';

interface ResourceRowProps {
  /**
   * Whether or not the dropdown for actions should be up.
   */
  dropdownUp: boolean;

  /**
   * The resource to display the data of.
   */
  resource: Resource;

  /**
   * The callback for when an existing resource is edited.
   */
  onEdit: (resource: Resource) => void;

  /**
   * The callback for when an existing resource is deleted.
   */
  onDelete: (id: number) => void;

  /**
   * The JSON schema of the resource.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * Whether the checkbox for this resource row is selected.
   */
  selected: boolean;

  /**
   * A callback function that is triggered when the checkbox is changed.
   */
  onSelected: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;

  /**
   * The list of properties to hide.
   */
  filter: Set<string>;
}

const filteredKeys = new Set(['id', '$author']);

/**
 * Display a resource in a table row.
 */
export function ResourceRow({
  dropdownUp,
  filter,
  onDelete,
  onEdit,
  onSelected,
  resource,
  schema,
  selected,
}: ResourceRowProps): ReactElement {
  const {
    params: { id: appId, resourceName },
    url,
  } = useRouteMatch<RouteParams>();
  const { app } = useApp();
  const [editingResource, setEditingResource] = useState<Resource>();
  const modal = useToggle();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const onSetClonable = useCallback(async () => {
    const { data } = await axios.put<Resource>(
      `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
      {
        ...resource,
        $clonable: !resource.$clonable,
      },
    );
    onEdit(data);
  }, [appId, onEdit, resource, resourceName]);

  const openEditModal = useCallback(() => {
    modal.enable();
    setEditingResource(resource);
  }, [modal, resource]);

  const closeEditModal = useCallback(() => {
    modal.disable();
    setEditingResource(null);
  }, [modal]);

  const onEditChange = useCallback((event: NamedEvent, value: Resource) => {
    setEditingResource(value);
  }, []);

  const onEditSubmit = useCallback(async () => {
    try {
      const { data } = await axios.put<Resource>(
        `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
        editingResource,
      );
      push({
        body: formatMessage(messages.updateSuccess, { id: resource.id }),
        color: 'primary',
      });
      onEdit(data);
      closeEditModal();
    } catch {
      push(formatMessage(messages.updateError));
    }
  }, [
    appId,
    closeEditModal,
    editingResource,
    formatMessage,
    onEdit,
    push,
    resource.id,
    resourceName,
  ]);

  const onConfirmDelete = useCallback(
    () =>
      axios
        .delete(`/api/apps/${appId}/resources/${resourceName}/${resource.id}`)
        .then(() => {
          push({
            body: formatMessage(messages.deleteSuccess, { id: resource.id }),
            color: 'primary',
          });
          onDelete(resource.id);
        })
        .catch(() => push(formatMessage(messages.deleteError))),
    [appId, formatMessage, onDelete, push, resource, resourceName],
  );

  const handleDeleteResource = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancelButton} />,
    confirmLabel: <FormattedMessage {...messages.deleteButton} />,
    action: onConfirmDelete,
  });

  return (
    <tr className={styles.root}>
      {!filter.has('$actions') && (
        <td className={`is-flex is-paddingless ${styles.actionCell}`}>
          <Checkbox
            checked={selected}
            className={`px-2 py-2 is-inline-block ${styles.boolean}`}
            name={String(resource.id)}
            onChange={onSelected}
          />
          <Dropdown
            className={classNames(styles.dropdown, { 'is-up': dropdownUp })}
            dropdownIcon="ellipsis-v"
            label=""
          >
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              icon="pen"
              onClick={openEditModal}
            >
              <FormattedMessage {...messages.edit} />
            </Button>
            <hr className="dropdown-divider" />
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              component={Link}
              icon="book"
              to={`${url}/${resource.id}`}
            >
              <FormattedMessage {...messages.details} />
            </Button>
            <hr className="dropdown-divider" />
            <Button
              className={`${styles.noBorder} pl-5 dropdown-item`}
              color="danger"
              icon="trash-alt"
              inverted
              onClick={handleDeleteResource}
            >
              <FormattedMessage {...messages.deleteButton} />
            </Button>
          </Dropdown>
          <ModalCard
            cardClassName={styles.modal}
            component={Form}
            footer={
              <>
                <CardFooterButton onClick={closeEditModal}>
                  <FormattedMessage {...messages.cancelButton} />
                </CardFooterButton>
                <CardFooterButton color="primary" type="submit">
                  <FormattedMessage {...messages.editButton} />
                </CardFooterButton>
              </>
            }
            isActive={modal.enabled}
            onClose={closeEditModal}
            onSubmit={onEditSubmit}
            title={
              <FormattedMessage
                {...messages.editTitle}
                values={{ resource: resourceName, id: resource.id }}
              />
            }
          >
            <JSONSchemaEditor
              name="resource"
              onChange={onEditChange}
              schema={schema}
              value={editingResource}
            />
          </ModalCard>
        </td>
      )}
      {!filter.has('id') && <td className={styles.id}>{resource.id}</td>}
      {!filter.has('$author') && (
        <td className={styles.author}>{resource.$author?.name ?? resource.$author?.id}</td>
      )}
      {!filter.has('$created') && (
        <td>
          <time dateTime={resource.$created}>
            <FormattedDate day="numeric" month="short" value={resource.$created} year="numeric" />
          </time>
        </td>
      )}

      {!filter.has('$updated') && (
        <td>
          <time dateTime={resource.$updated}>
            <FormattedDate day="numeric" month="short" value={resource.$updated} year="numeric" />
          </time>
        </td>
      )}

      {Object.hasOwnProperty.call(app, 'resources') && !filter.has('$clonable') && (
        <td>
          <ClonableCheckbox
            checked={resource.$clonable}
            id={`clonable${resource.id}`}
            onChange={onSetClonable}
          />
        </td>
      )}

      {Object.entries(schema?.properties ?? {})
        .filter(([key]) => !filteredKeys.has(key) && !filter.has(key))
        .map(([key, subSchema]) => (
          <ResourceCell
            key={key}
            required={Boolean(schema.required?.includes(key))}
            schema={subSchema}
            value={resource[key]}
          />
        ))}
    </tr>
  );
}

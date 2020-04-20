import {
  Button,
  CardFooterButton,
  Checkbox,
  Content,
  FileUpload,
  Loader,
  Message,
  Modal,
  Table,
  Title,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import { extension } from 'mime-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import download from '../../utils/download';
import { useApp } from '../AppContext';
import HelmetIntl from '../HelmetIntl';
import AssetPreview from './components/AssetPreview';
import styles from './index.css';
import messages from './messages';

export interface Asset {
  id: string;
  mime: string;
  filename: string;
}

export default function Assets(): React.ReactElement {
  const { app } = useApp();
  const intl = useIntl();
  const push = useMessages();

  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
  const [dialog, setDialog] = React.useState<'upload' | 'preview' | 'delete'>(null);
  const [previewedAsset, setPreviewedAsset] = React.useState<Asset>(null);
  const [file, setFile] = React.useState<File>();

  const onClose = React.useCallback(() => {
    setDialog(null);
    setPreviewedAsset(null);
  }, []);

  const onUploadClick = React.useCallback(() => {
    setDialog('upload');
  }, []);

  const onUpload = React.useCallback(async () => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const { data } = await axios.post(`/api/apps/${app.id}/assets`, file, {
      headers: { 'content-type': file.type },
    });

    push({ color: 'success', body: intl.formatMessage(messages.uploadSuccess, { id: data.id }) });

    setAssets([...assets, data]);
    setFile(null);
    onClose();
  }, [app, assets, file, intl, onClose, push]);

  const onFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setFile(e.target.files[0]);
  }, []);

  const onDeleteAssetsClick = React.useCallback(() => {
    setDialog('delete');
  }, []);

  const onDelete = React.useCallback(async () => {
    await Promise.all(
      selectedAssets.map((asset) => axios.delete(`/api/apps/${app.id}/assets/${asset}`)),
    );

    push(
      intl.formatMessage(messages.deleteSuccess, {
        amount: selectedAssets.length,
        assets: selectedAssets.sort().join(', '),
      }),
    );
    onClose();
    setAssets(assets.filter((asset) => !selectedAssets.includes(asset.id)));
    setSelectedAssets([]);
  }, [app, assets, intl, onClose, push, selectedAssets]);

  const onPreviewClick = React.useCallback((asset: Asset) => {
    setPreviewedAsset(asset);
    setDialog('preview');
  }, []);

  const downloadAsset = React.useCallback(
    async (asset) => {
      try {
        const { filename, id } = asset;
        const mime = extension(asset.mime);

        await download(`/api/apps/${app.id}/assets/${id}`, filename || mime ? `${id}.${mime}` : id);
      } catch (e) {
        push(intl.formatMessage(messages.downloadError));
      }
    },
    [app, push, intl],
  );

  const onAssetCheckboxClick = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const id = event.target.name.replace(/^asset/, '');

      if (!checked) {
        setSelectedAssets(selectedAssets.filter((a) => a !== id));
      } else {
        setSelectedAssets([...selectedAssets, id]);
      }
    },
    [selectedAssets],
  );

  React.useEffect(() => {
    try {
      axios.get<Asset[]>(`/api/apps/${app.id}/assets`).then((result) => {
        setAssets(result.data);
        setLoading(false);
      });
    } catch (e) {
      setError(true);
    }
  }, [app]);

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...error} />
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <HelmetIntl title={messages.title} titleValues={{ name: app.definition.name }} />
      <Title>
        <FormattedMessage {...messages.assets} />
      </Title>
      <div className="buttons">
        <Button color="primary" icon="upload" onClick={onUploadClick}>
          <FormattedMessage {...messages.uploadButton} />
        </Button>
        <Button
          color="danger"
          disabled={selectedAssets.length === 0}
          icon="trash-alt"
          onClick={onDeleteAssetsClick}
        >
          <FormattedMessage {...messages.deleteButton} values={{ amount: selectedAssets.length }} />
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.actions} />
            </th>
            <th>
              <FormattedMessage {...messages.id} />
            </th>
            <th>
              <FormattedMessage {...messages.mime} />
            </th>
            <th>
              <FormattedMessage {...messages.filename} />
            </th>
            <th>
              <FormattedMessage {...messages.preview} />
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>
                <Checkbox
                  checked={selectedAssets.includes(asset.id)}
                  id={`check${asset.id}`}
                  name={`check${asset.id}`}
                  onChange={onAssetCheckboxClick}
                  wrapperClassName={`is-inline-block ${styles.assetCheckbox}`}
                />
                <Button color="primary" icon="download" onClick={() => downloadAsset(asset)} />
              </td>
              <td>{asset.id}</td>
              <td>{asset.mime}</td>
              <td>{asset.filename}</td>
              <td>
                <Button onClick={() => onPreviewClick(asset)}>
                  <FormattedMessage {...messages.preview} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal
        footer={
          <>
            <CardFooterButton onClick={onClose}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="danger" onClick={onDelete}>
              <FormattedMessage {...messages.delete} />
            </CardFooterButton>
          </>
        }
        isActive={dialog === 'delete'}
        onClose={onClose}
        title={
          <FormattedMessage
            {...messages.deleteWarningTitle}
            values={{ amount: selectedAssets.length }}
          />
        }
      >
        <FormattedMessage values={{ amount: selectedAssets.length }} {...messages.deleteWarning} />
      </Modal>
      <Modal
        footer={
          <>
            <CardFooterButton onClick={onClose}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="primary" onClick={onUpload}>
              <FormattedMessage {...messages.upload} />
            </CardFooterButton>
          </>
        }
        isActive={dialog === 'upload'}
        onClose={onClose}
        title={<FormattedMessage {...messages.uploadTitle} />}
      >
        <Content>
          <FileUpload
            className={styles.filePicker}
            fileButtonLabel={<FormattedMessage {...messages.chooseFile} />}
            fileLabel={file?.name || <FormattedMessage {...messages.noFile} />}
            formComponentClassName={styles.filePicker}
            label={<FormattedMessage {...messages.file} />}
            onChange={onFileChange}
          />
        </Content>
      </Modal>
      <Modal
        isActive={dialog === 'preview'}
        onClose={onClose}
        title={<FormattedMessage {...messages.preview} />}
      >
        <AssetPreview asset={previewedAsset} />
      </Modal>
    </>
  );
}

import { Button, Content } from '@appsemble/react-components/src';
import { extension } from 'mime-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import download from '../../../../utils/download';
import { useApp } from '../../../AppContext';
import type { Asset } from '../../index';
import styles from './index.css';
import messages from './messages';

export default function AssetPreview({ asset }: { asset: Asset }): React.ReactElement {
  const { app } = useApp();

  const downloadAsset = React.useCallback(async () => {
    const { filename, id, mime } = asset;
    const ex = extension(mime);

    await download(`/api/apps/${app.id}/assets/${id}`, filename || ex ? `${id}.${ex}` : id);
  }, [app, asset]);

  if (!asset) {
    return null;
  }

  const url = `/api/apps/${app.id}/assets/${asset.id}`;
  const isImage = asset.mime.startsWith('image');
  const isAudio = asset.mime.startsWith('audio');
  const isVideo = asset.mime.startsWith('video');

  return (
    <Content className={styles.preview}>
      <Button
        className={`${styles.downloadButton} ${styles.center}`}
        icon="download"
        onClick={downloadAsset}
      >
        <FormattedMessage {...messages.download} />
      </Button>
      <div className="box">
        {isImage && <img alt={asset.filename || `Asset ${asset.id}`} src={url} />}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isAudio && <audio controls src={url} />}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        {isVideo && <video controls src={url} />}
        {!isImage && !isAudio && !isVideo && <FormattedMessage {...messages.notSupported} />}
      </div>
    </Content>
  );
}

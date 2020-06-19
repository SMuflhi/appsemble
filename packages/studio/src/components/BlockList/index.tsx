import { Loader, Message, useData } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import BlockCard from './components/BlockCard';
import styles from './index.css';
import messages from './messages';

/**
 * Display a list of cards representing the available blocks.
 */
export default function BlockList(): React.ReactElement {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  const appsembleBlocks = blocks
    .filter((b) => b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));
  const thirdPartyBlocks = blocks
    .filter((b) => !b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <HelmetIntl title={messages.title} />
      <div className={styles.blockList}>
        {appsembleBlocks.map((block) => (
          <BlockCard key={block.name} block={block} />
        ))}
        {thirdPartyBlocks.map((block) => (
          <BlockCard key={block.name} block={block} />
        ))}
      </div>
    </>
  );
}

import { Loader } from '@appsemble/react-components';
import type { BlockDefinition, Security } from '@appsemble/types';
import { checkAppRole, normalizeBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import type { EventEmitter } from 'events';
import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import type { ShowDialogAction } from '../../types';
import type { ActionCreators } from '../../utils/actions';
import { useAppDefinition } from '../AppDefinitionProvider';
import Block from '../Block';
import { useUser } from '../UserProvider';
import styles from './index.css';

interface BlockListProps {
  blocks: BlockDefinition[];
  data?: any;
  ee: EventEmitter;
  extraCreators?: ActionCreators;
  flowActions?: {};
  prefix: string;
  showDialog: ShowDialogAction;
  transitions?: boolean;
}

function filterBlocks(
  security: Security,
  blocks: BlockDefinition[],
  userRole: string,
): BlockDefinition[] {
  return blocks.filter(
    (block) =>
      block.roles === undefined ||
      block.roles.length === 0 ||
      block.roles.some((r) => checkAppRole(security, r, userRole)),
  );
}

export default function BlockList({
  blocks,
  data,
  ee,
  extraCreators,
  flowActions,
  prefix,
  showDialog,
  transitions,
}: BlockListProps): React.ReactElement {
  const { blockManifests, definition, revision } = useAppDefinition();
  const { isLoggedIn, role } = useUser();
  const location = useLocation();

  const blockList = React.useMemo(() => filterBlocks(definition.security, blocks, role), [
    blocks,
    definition,
    role,
  ]);

  const blockStatus = React.useRef(blockList.map(() => false));
  const [pageReady, setPageReady] = React.useState<Promise<void>>();

  const [isLoading, setLoading] = React.useState(true);
  const resolvePageReady = React.useRef<Function>();

  const ready = React.useCallback(
    (block: BlockDefinition) => {
      blockStatus.current[blockList.indexOf(block)] = true;
      if (blockStatus.current.every(Boolean)) {
        setLoading(false);
        resolvePageReady.current();
      }
    },
    [blockList],
  );

  React.useEffect(() => {
    setPageReady(
      new Promise((resolve) => {
        resolvePageReady.current = resolve;
      }),
    );
  }, [blockList]);

  if (!blockList.length) {
    if (!isLoggedIn) {
      const redirect = `${location.pathname}${location.search}${location.hash}`;
      return <Redirect to={`/Login?${new URLSearchParams({ redirect })}`} />;
    }

    return <Redirect to="/" />;
  }

  const list = blockList.map((block, index) => {
    const manifest = blockManifests.find(
      (m) => m.name === normalizeBlockName(block.type) && m.version === block.version,
    );

    const layout = manifest.layout || 'grow';

    const content = (
      <Block
        // As long as blocks are in a static list, using the index as a key should be fine.
        // eslint-disable-next-line react/no-array-index-key
        key={`${revision}-${index}`}
        block={block}
        className={classNames(styles[layout], {
          'is-hidden': isLoading,
          [styles.transitionWrapper]: transitions,
        })}
        data={data}
        ee={ee}
        extraCreators={extraCreators}
        flowActions={flowActions}
        pageReady={pageReady}
        prefix={`${prefix}.${index}`}
        ready={ready}
        showDialog={showDialog}
      />
    );

    if (layout === 'float' || layout === 'hidden') {
      return content;
    }

    return transitions ? (
      <CSSTransition
        // Since blocks are in a static list, using the index as a key should be fine.
        // eslint-disable-next-line react/no-array-index-key
        key={`${revision}-${index}`}
        classNames={{
          enter: styles.pageEnter,
          enterActive: styles.pageEnterActive,
          exit: styles.pageExit,
          exitActive: styles.pageExitActive,
        }}
        timeout={300}
      >
        {content}
      </CSSTransition>
    ) : (
      content
    );
  });

  return (
    <>
      {isLoading && <Loader />}
      {transitions ? (
        <TransitionGroup className={styles.transitionGroup}>{list}</TransitionGroup>
      ) : (
        list
      )}
    </>
  );
}

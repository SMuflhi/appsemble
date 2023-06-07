import { type BlockDefinition, type BlockManifest } from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils/blockUtils.js';
import { type MutableRefObject, type ReactElement, type Ref, useCallback, useState } from 'react';
import { type JsonObject } from 'type-fest';
import { type Document, type Node, type ParsedNode, type YAMLSeq } from 'yaml';

import BlockProperty from './BlockProperty/index.js';
import { BlockStore } from './BlockStore/index.js';
import { ElementsList } from './ElementsList/index.js';
import styles from './index.module.css';
import { PageProperty } from './PageProperty/index.js';
import { UndoRedo } from './UndoRedo/index.js';
import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { generateData } from '../Utils/schemaGenerator.js';

interface PagesTabProps {
  addIn: (path: Iterable<unknown>, value: Node) => void;
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  deleteIn: (path: Iterable<unknown>) => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  frameRef: Ref<HTMLIFrameElement>;
  index: number;
  isOpenLeft: boolean;
  isOpenRight: boolean;
  onRedo: () => void;
  onUndo: () => void;
  stackSize: number;
}

export function PagesTab({
  addIn,
  changeIn,
  deleteIn,
  docRef,
  frameRef,
  index,
  isOpenLeft,
  isOpenRight,
  onRedo,
  onUndo,
  stackSize,
}: PagesTabProps): ReactElement {
  const { app } = useApp();
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubParent, setSelectedSubParent] = useState<number>(-1);
  const [editPageView, setEditPageView] = useState<boolean>(false);
  const [editBlockView, setEditBlockView] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<Boolean>(false);
  const [blockManifest, setBlockManifest] = useState<BlockManifest>(null);
  const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);

  const onDragEvent = (data: BlockManifest): void => {
    setBlockManifest(data);
    setDropzoneActive(true);
  };
  const handleDragEnter = (): void => {
    setDragOver(true);
  };
  const handleDragExit = (): void => {
    setDragOver(false);
  };

  const getSelectedBlockDefinition = (blockIndex: number): Document<ParsedNode> => {
    const selectedBlockDef = docRef.current.getIn([
      'pages',
      selectedPage,
      'blocks',
      selectedBlock,
    ]) as Document<ParsedNode>;
    setSelectedBlock(blockIndex);
    return selectedBlockDef;
  };

  const onChangePagesBlocks = useCallback(
    (page: number, subParent: number, block: number) => {
      setSelectedPage(page);
      setSelectedBlock(block);
      setSelectedSubParent(subParent);
      if (block !== -1) {
        setEditPageView(false);
        setEditBlockView(true);
        return;
      }
      if (page !== -1 && block === -1) {
        setEditPageView(true);
        setEditBlockView(false);
      }
    },
    [setSelectedPage, setSelectedBlock, setSelectedSubParent],
  );

  const onCreatePage = useCallback(() => {
    setEditPageView(true);
    setEditBlockView(false);
    setSelectedPage(-1);
  }, [setEditPageView, setEditBlockView]);

  const onCreateBlock = useCallback(
    (pageToAdd: number) => {
      setEditPageView(false);
      setEditBlockView(true);
      setSelectedPage(pageToAdd);
    },
    [setEditPageView, setEditBlockView, setSelectedPage],
  );

  const addBlock = (nb: BlockDefinition): void => {
    const doc = docRef.current;
    const newBlockNode = doc.createNode(nb);
    const pageBlocks = doc.getIn(['pages', selectedPage, 'blocks']) as YAMLSeq;
    const newBlockIndex = pageBlocks.items.length;
    addIn(['pages', selectedPage, 'blocks'], newBlockNode);
    onChangePagesBlocks(selectedPage, 0, newBlockIndex);
  };

  const deleteBlock = (): void => {
    deleteIn(['pages', selectedPage, 'blocks', selectedBlock]);
    onChangePagesBlocks(selectedPage, 0, selectedBlock - 1);
  };

  const changeProperty = (parameters: JsonObject): void => {
    const doc = docRef.current;
    changeIn(
      ['pages', selectedPage, 'blocks', selectedBlock, 'parameters'],
      doc.createNode(parameters) as Node,
    );
  };

  const changeType = (blockType: BlockManifest): void => {
    const doc = docRef.current;
    const newBlockType = {
      type: normalizeBlockName(blockType.name),
      version: blockType.version,
      parameters: generateData(blockType.parameters.definitions, blockType.parameters),
    } as BlockDefinition;
    changeIn(
      ['pages', selectedPage, 'blocks', selectedBlock],
      doc.createNode(newBlockType) as Node,
    );
  };

  const handleDrop = (): void => {
    setDropzoneActive(false);
    const newBlock = {
      type: normalizeBlockName(blockManifest.name),
      version: blockManifest.version,
      parameters: generateData(blockManifest.parameters.definitions, blockManifest.parameters),
    } as BlockDefinition;
    addBlock(newBlock);
  };

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <UndoRedo index={index} onRedo={onRedo} onUndo={onUndo} stackSize={stackSize} />
        <ElementsList
          changeIn={changeIn}
          docRef={docRef}
          onChange={onChangePagesBlocks}
          onCreateBlock={onCreateBlock}
          onCreatePage={onCreatePage}
          selectedBlock={selectedBlock}
          selectedPage={selectedPage}
          selectedSubParent={selectedSubParent}
        />
      </Sidebar>
      <div className={styles.root}>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={`${dropzoneActive ? styles.dropzoneActive : styles.dropzoneInactive}  ${
            dragOver ? styles.dropzoneDragOver : styles.dropzone
          } is-flex m-0 p-0`}
          draggable={false}
          onDragEnter={handleDragEnter}
          onDragExit={handleDragExit}
          onDragLeave={handleDragExit}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        />
        <Preview app={app} iframeRef={frameRef} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          {editPageView ? <PageProperty selectedPage={selectedPage} /> : null}
          {editBlockView ? (
            <BlockProperty
              changeProperty={changeProperty}
              changeType={changeType}
              deleteBlock={deleteBlock}
              selectedBlock={getSelectedBlockDefinition(selectedBlock)}
              selectedPage={selectedPage}
            />
          ) : null}
        </div>
        <BlockStore dragEventListener={onDragEvent} />
      </Sidebar>
    </>
  );
}

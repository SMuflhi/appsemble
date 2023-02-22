import { FormattedMessage } from '@appsemble/preact';
import { VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import WordCloud, { ListEntry } from 'wordcloud';

import styles from './wordcloud.module.css';

function mapArrayToWordcloudObject(words: string[]): ListEntry[] {
  const kvPair: Record<string, number> = Object.create(null);

  for (const word of words) {
    kvPair[word] = (kvPair[word] || 0) + 1;
  }

  return Object.entries(kvPair);
}

interface WordcloudProps {
  readonly shape: string;
  readonly options: object;
  readonly words: string[];
}

export function WordcloudLogic(props: WordcloudProps): VNode {
  const canvasRef = useRef<HTMLCanvasElement>();
  const canvasWidth = Math.floor(window.innerWidth * 0.61);
  const canvasHeight = Math.floor(window.innerHeight * 0.82);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const list = mapArrayToWordcloudObject(props.words);

    WordCloud(canvasRef.current, {
      color: '#000000',
      rotateRatio: 0,
      ...props.options,
      list,
    });
  }, [props.options, props.words]);

  if (!WordCloud.isSupported) {
    return <FormattedMessage id="unsupported" />;
  }

  return (
    <div className="canvasContainer">
      <canvas
        className={styles.centerCloud}
        height={canvasHeight}
        ref={canvasRef}
        width={canvasWidth}
      />
    </div>
  );
}

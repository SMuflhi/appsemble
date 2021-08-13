import { useBlock } from '@appsemble/preact';
import { Button, Input, Location } from '@appsemble/preact-components';
import { IconName } from '@appsemble/sdk';
import { DivIcon, Icon } from 'leaflet';
import { JSX, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { AvatarWrapper } from '../AvatarWrapper';
import { CardImage } from '../CardImage';
import { createIcon } from '../utils/createIcon';
import styles from './index.module.css';

export interface CardProps {
  /**
   * The content for this specific card to render.
   */
  content: {
    id: number;
    status: string;
    photos: string[];
  };

  /**
   * Update function that can be called to update a single resource
   */
  onUpdate: (data: unknown) => void;
}

/**
 * A single card in the feed.
 */
export function Card({ content, onUpdate }: CardProps): VNode {
  const replyContainer = useRef<HTMLDivElement>();
  const { actions, parameters, theme, utils } = useBlock();
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState<unknown[]>(null);
  const [valid, setValid] = useState(false);
  const [marker, setMarker] = useState<DivIcon | Icon>(null);

  useEffect(() => {
    createIcon({ parameters, utils }).then(setMarker);
  }, [parameters, utils]);

  useEffect(() => {
    const parentId = parameters.reply?.parentId ?? 'parentId';

    if (replies != null) {
      return;
    }

    if (actions.onLoadReply.type === 'noop') {
      setReplies([]);
    } else {
      // Dispatch loading replies if it’s defined.
      actions.onLoadReply({ $filter: `${parentId} eq '${content.id}'` }).then(setReplies);
    }
  }, [actions, content, parameters, replies, setReplies]);

  const onAvatarClick = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();
      const data = await actions.onAvatarClick(content);

      if (data) {
        onUpdate(data);
      }
    },
    [actions, content, onUpdate],
  );

  const onButtonClick = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();
      const data = await actions.onButtonClick(content);

      if (data) {
        onUpdate(data);
      }
    },
    [actions, content, onUpdate],
  );

  const onChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>, value: string): void => {
      setMessage(value);
      setValid(event.currentTarget.validity.valid);
    },
    [setMessage, setValid],
  );

  const onSubmit = useCallback(
    async (event: Event): Promise<void> => {
      event.preventDefault();

      if (!valid) {
        return;
      }

      try {
        const parentId = parameters.reply?.parentId ?? 'parentId';
        const result = await actions.onSubmitReply({
          [parentId]: content.id,
          content: message,
        });

        setMessage('');
        setReplies([...replies, result]);

        // Scroll to the bottom of the reply container
        replyContainer.current.scrollTop = replyContainer.current.scrollHeight;
      } catch {
        utils.showMessage(utils.formatMessage('replyErrorMessage'));
      }
    },
    [actions, content, message, parameters, replies, utils, valid],
  );

  const title = utils.remap(parameters.title, content);
  const subtitle = utils.remap(parameters.subtitle, content);
  const heading = utils.remap(parameters.heading, content);
  const picture = utils.remap(parameters.picture, content);
  const pictures = utils.remap(parameters.pictures, content);
  const description = utils.remap(parameters.description, content);
  const latitude = utils.remap(parameters.marker.latitude, content);
  const longitude = utils.remap(parameters.marker.longitude, content);

  if (parameters.pictureBase?.endsWith('/')) {
    parameters.pictureBase = parameters.pictureBase.slice(0, -1);
  }

  let color;
  let icon: IconName;

  // XXX: Standardize this based on app definition
  switch (content?.status) {
    case 'open':
      color = 'has-background-danger';
      icon = 'exclamation';
      break;
    case 'in-behandeling':
      color = 'has-background-warning';
      icon = 'cog';
      break;
    case 'opgelost':
      color = 'has-background-success';
      icon = 'check';
      break;
    default:
      color = '';
      icon = 'user';
  }

  return (
    <article className="card mx-2 my-2">
      <div className="card-content">
        <div className={`media ${styles.media}`}>
          <AvatarWrapper action={actions.onAvatarClick} onAvatarClick={onAvatarClick}>
            <figure className={`image is-48x48 ${color} ${styles.avatarIcon}`}>
              <span className="icon">
                <i className={`${utils.fa(icon)} fa-2x`} />
              </span>
            </figure>
          </AvatarWrapper>
          <header className="media-content">
            {title && <h4 className="title is-4 is-marginless">{title}</h4>}
            {subtitle && <h5 className="subtitle is-5 is-marginless">{subtitle}</h5>}
            {heading && <p className="subtitle is-6">{heading}</p>}
          </header>
        </div>
      </div>
      <div className="card-image">
        {picture && (
          <CardImage
            alt={title || subtitle || heading || description}
            src={picture ? utils.asset(picture) : ''}
          />
        )}
        {pictures && Array.isArray(pictures) && pictures.length > 1 && (
          <div className={`${styles.images} px-1 py-1`}>
            {pictures.map((p) => (
              <CardImage
                alt={title || subtitle || heading || description}
                className="image is-64x64 mx-1 my-1"
                key={p}
                src={p ? utils.asset(p) : ''}
              />
            ))}
          </div>
        )}
        {(latitude && longitude) != null && marker && (
          <Location
            className={styles.location}
            latitude={latitude}
            longitude={longitude}
            mapOptions={{
              dragging: false,
              zoomControl: false,
            }}
            marker={marker}
            theme={theme}
          />
        )}
      </div>
      <div className="card-content px-4 py-4">
        {description && <p className="content">{description}</p>}
        {actions.onButtonClick.type !== 'noop' && (
          <Button className={`${styles.button} mb-4`} onClick={onButtonClick}>
            {parameters.buttonLabel ?? 'Click'}
          </Button>
        )}
        {actions.onLoadReply.type !== 'noop' && replies && (
          <>
            <div className={styles.replies} ref={replyContainer}>
              {replies.map((reply: any) => {
                const author =
                  utils.remap(
                    parameters?.reply.author ?? [{ prop: '$author' }, { prop: 'name' }],
                    reply,
                  ) || utils.formatMessage('anonymousLabel');
                const replyContent = utils.remap(
                  parameters?.reply.content ?? [{ prop: 'content' }],
                  reply,
                );

                return (
                  <div className="content" key={reply.id}>
                    <h6 className="is-marginless">{author}</h6>
                    <p>{replyContent}</p>
                  </div>
                );
              })}
            </div>
            <form className="is-flex py-2 px-0" noValidate onSubmit={onSubmit}>
              <Input
                onChange={onChange}
                placeholder={utils.formatMessage('replyLabel')}
                required
                value={message}
              />
              <Button
                className={`${styles.replyButton} ml-1`}
                disabled={!valid}
                icon="paper-plane"
                type="submit"
              />
            </form>
          </>
        )}
      </div>
    </article>
  );
}

import {
  Button,
  CardFooterButton,
  FileUpload,
  Modal,
  useObjectURL,
  useToggle,
} from '@appsemble/react-components';
import { Permission } from '@appsemble/utils/src';
import axios from 'axios';
import React, { ReactElement, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { checkRole } from '../../utils/checkRole';
import { useApp } from '../AppContext';
import { useUser } from '../UserProvider';
import { AppScreenshot } from './AppScreenshot';
import styles from './index.css';
import { messages } from './messages';

export function AppScreenshots(): ReactElement {
  const { app, setApp } = useApp();
  const { organizations } = useUser();
  const { formatMessage } = useIntl();

  const screenshotModal = useToggle();
  const [uploadingScreenshot, setUploadingScreenshot] = useState<File>();
  const uploadingScreenshotPreview = useObjectURL(uploadingScreenshot);

  const userRole = organizations?.find((org) => org.id === app.OrganizationId)?.role;
  const mayManageScreenshots = userRole && checkRole(userRole, Permission.EditAppSettings);

  const screenshotDiv = useRef<HTMLDivElement>();
  const scrollScreenshots = useCallback((reverse = false) => {
    if (!screenshotDiv.current) {
      return;
    }

    screenshotDiv.current.scrollLeft += reverse ? -255 : 255;
  }, []);
  const scrollRight = useCallback(() => {
    scrollScreenshots();
  }, [scrollScreenshots]);
  const scrollLeft = useCallback(() => {
    scrollScreenshots(true);
  }, [scrollScreenshots]);

  const onScreenshotChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingScreenshot(event.currentTarget.files[0]);
  }, []);

  const closeModal = useCallback(() => {
    screenshotModal.disable();
    setUploadingScreenshot(null);
  }, [screenshotModal]);

  const onSubmitScreenshot = useCallback(async () => {
    const form = new FormData();
    form.append('screenshots', uploadingScreenshot, uploadingScreenshot.name);
    const { data: ids } = await axios.post<number[]>(`/api/apps/${app.id}/screenshots`, form);
    setApp({
      ...app,
      screenshotUrls: [
        ...app?.screenshotUrls,
        ...ids.map((id) => `/api/apps/${app.id}/screenshots/${id}`),
      ],
    });
    closeModal();
  }, [app, setApp, uploadingScreenshot, closeModal]);

  if (!mayManageScreenshots && !app.screenshotUrls.length) {
    return null;
  }

  return (
    <>
      <div className={`has-background-white-ter is-flex ${styles.wrapper}`}>
        {mayManageScreenshots && (
          <Button
            className={`mt-2 mr-2 ${styles.createScreenshotButton}`}
            onClick={screenshotModal.enable}
          >
            <FormattedMessage {...messages.addNewScreenshot} />
          </Button>
        )}
        {app.screenshotUrls.length !== 0 && (
          <div className="my-4 is-flex">
            <Button
              className={`is-medium ${styles.scrollButton}`}
              icon="chevron-left"
              onClick={scrollLeft}
            />
            <div className={`px-4 ${styles.screenshots}`} ref={screenshotDiv}>
              {app.screenshotUrls.map((url) => (
                <AppScreenshot key={url} mayManageScreenshots={mayManageScreenshots} url={url} />
              ))}
            </div>
            <Button
              className={`is-medium ${styles.scrollButton}`}
              icon="chevron-right"
              onClick={scrollRight}
            />
          </div>
        )}
      </div>
      <Modal
        footer={
          <>
            <CardFooterButton onClick={closeModal}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton
              color="primary"
              disabled={!uploadingScreenshot}
              onClick={onSubmitScreenshot}
            >
              <FormattedMessage {...messages.submit} />
            </CardFooterButton>
          </>
        }
        isActive={screenshotModal.enabled}
        onClose={closeModal}
        title={<FormattedMessage {...messages.submit} />}
      >
        <FileUpload
          accept="image/jpeg, image/png, image/tiff, image/webp"
          fileButtonLabel={<FormattedMessage {...messages.screenshot} />}
          fileLabel={uploadingScreenshot?.name ?? <FormattedMessage {...messages.noFile} />}
          label={<FormattedMessage {...messages.screenshot} />}
          name="screenshot"
          onChange={onScreenshotChange}
          preview={
            uploadingScreenshot && (
              <figure className={`mb-2 ${styles.screenshotPreview}`}>
                <img
                  alt={formatMessage(messages.screenshot)}
                  className={styles.screenshotPreview}
                  src={uploadingScreenshotPreview}
                />
              </figure>
            )
          }
          required
        />
      </Modal>
    </>
  );
}

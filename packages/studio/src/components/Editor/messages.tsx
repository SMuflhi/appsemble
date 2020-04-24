import { defineMessages } from 'react-intl';

export default defineMessages({
  title: '{name} · Editor',
  schemaValidationFailed:
    'App schema validation failed. Please check if the following properties are correct: {properties}',
  appNotFound: 'App does not exist',
  yamlNotFound:
    'Unable to restore original YAML. Formatting may be different from what was previously published.',
  error: 'Something went wrong trying to load this app',
  errorUpdate: 'Something went wrong trying to update the app recipe',
  forbidden: 'User is not allowed to update this app',
  invalidYaml: 'Invalid YAML',
  invalidStyle: 'Invalid CSS',
  updateSuccess: 'Successfully updated app recipe',
  unexpected: 'Something went wrong when validating the app recipe',
  resourceWarningTitle: 'Resource warning',
  resourceWarning:
    'The resource definitions in this app recipe contain different data from the original. This may cause unexpected results when using older data.',
  preview: 'Preview',
  publish: 'Publish',
  viewLive: 'View live',
  recipe: 'Recipe',
  coreStyle: 'Core style',
  sharedStyle: 'Shared style',
  iframeTitle: 'App preview',
  cancel: 'Cancel',
  switchGUI: 'Switch Interface',
  addBlock: 'Add Block',
  editBlock: 'Edit ',
  deleteBlock: 'Delete ',
});

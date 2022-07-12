import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  profile: 'Public profile',
  title: 'Profile',
  loadEmailError: 'There was a problem loading your registered email addresses.',
  actions: 'Actions',
  addEmail: 'Add an email address',
  addEmailSuccess: 'Successfully added email address',
  addEmailConflict: 'This email address has already been registered.',
  addEmailError: 'Something went wrong when trying to add this email address.',
  cancel: 'Cancel',
  deleteEmail: 'Remove email address',
  deleteEmailSuccess: 'Successfully removed email address.',
  email: 'Email',
  emails: 'Emails',
  emailWarningTitle: 'Deleting email address',
  emailWarning: 'Are you sure you want to remove this email address?',
  displayName: 'Display Name',
  displayNameHelp: 'This is the name that displays for other users.',
  saveProfile: 'Save Profile',
  submitSuccess: 'Successfully updated profile.',
  submitError: 'Something went wrong trying to update your profile.',
  setPrimaryEmail: 'Set as primary',
  primaryEmailSuccess: 'Successfully set {email} as your primary email address.',
  verified: 'Verified',
  unverified: 'Not verified',
  primary: 'Primary',
  preferredLanguage: 'Preferred language',
  preferredLanguageHelp: 'The preferred language to use for the Appsemble Studio.',
  timezone: 'Time zone',
  timezoneHelp: 'The time zone used for formatting time in emails',
});

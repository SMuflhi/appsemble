import type {
  Action,
  HTTPMethods,
  LogAction,
  RequestLikeActionTypes,
  Theme,
} from '@appsemble/sdk/src/types';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import type { OpenAPIV3 } from 'openapi-types';
import type { JsonObject } from 'type-fest';

export type { Theme };

/**
 * A block that is displayed on a page.
 */
export interface Block {
  /**
   * The type of the block.
   *
   * A block type follow the format `@organization/name`.
   * If the organization is _appsemble_, it may be omitted.
   *
   * Pattern:
   * ^(@[a-z]([a-z\d-]{0,30}[a-z\d])?\/)?[a-z]([a-z\d-]{0,30}[a-z\d])$
   *
   * Examples:
   * - `form`
   * - `@amsterdam/splash`
   */
  type: string;

  /**
   * A [semver](https://semver.org) representation of the block version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * An optional header to render above the block.
   */
  header?: string;

  /**
   * The theme of the block.
   */
  theme?: Partial<Theme>;

  /**
   * A free form mapping of named paramters.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  parameters?: JsonObject;

  /**
   * A mapping of actions that can be fired by the block to action handlers.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  actions?: { [action: string]: ActionDefinition };

  /**
   * Mapping of the events the block can listen to and emit.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  events?: {
    listen?: { [listener: string]: string };
    emit?: { [emitter: string]: string };
  };

  /**
   * A list of roles that are allowed to view this block.
   */
  roles?: string[];
}

/**
 * OpenID Connect specifies a set of standard claims about the end-user, which cover common profile
 * information such as name, contact details, date of birth and locale.
 *
 * The Connect2id server can be set up to provide additional custom claims, such as roles and
 * permissions.
 */
export interface UserInfo {
  /**
   * The subject (end-user) identifier. This member is always present in a claims set.
   */
  sub: string;

  /**
   * The full name of the end-user, with optional language tag.
   */
  name: string;

  /**
   * The end-user's preferred email address.
   */
  email: string;

  /**
   * True if the end-user's email address has been verified, else false.
   */
  // eslint-disable-next-line camelcase
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture: string;

  /**
   * A URL that links to the user profile.
   */
  profile: string;
}

/**
 * The payload stored in our JSON web tokens
 */
export interface JwtPayload {
  aud: string;
  exp: number;
  iat: string;
  iss: string;
  scope: string;
  sub: string;
}

/**
 * A response for a login token request
 */
export interface TokenResponse {
  /**
   * The bearer access token to use for authenticating requests.
   */
  // eslint-disable-next-line camelcase
  access_token: string;

  /**
   * How long until the access token expires in seconds from now.
   */
  // eslint-disable-next-line camelcase
  expires_in: number;

  /**
   * A refresh token for getting a new access token.
   */
  // eslint-disable-next-line camelcase
  refresh_token?: string;

  // eslint-disable-next-line camelcase
  token_type: 'bearer';
}

export interface SubscriptionResponseResource {
  create: boolean;
  update: boolean;
  delete: boolean;
  subscriptions?: {
    [id: string]: {
      update: boolean;
      delete: boolean;
    };
  };
}

export interface SubscriptionResponse {
  [type: string]: SubscriptionResponseResource;
}

export interface Security {
  login?: 'password';
  default: {
    role: string;
    policy?: 'everyone' | 'organization' | 'invite';
  };
  roles: {
    [role: string]: {
      description?: string;
      inherits?: string[];
    };
  };
}

export type Navigation = 'bottom' | 'left-menu' | 'hidden';

export interface NotificationDefinition {
  to?: string[];
  subscribe?: 'all' | 'single' | 'both';
  data?: {
    title: string;
    content: string;
    link: string;
  };
}

/**
 * A collection of hooks that are triggered upon calling a resource actions.
 */
export interface ResourceHooks {
  notification: NotificationDefinition;
}

export interface ResourceCall {
  /**
   * The HTTP method to use for making the HTTP request.
   */
  method?: HTTPMethods;

  /**
   * The URL to which to make the resource request.
   */
  url?: string;

  /**
   * The associated hooks with the resource action.
   */
  hooks?: ResourceHooks;

  /**
   * Query parameters to pass along with the request.
   */
  query?: { [key: string]: string };

  /**
   * THe roles that are allowed to perform this action.
   */
  roles?: string[];
}

interface ResourceReferenceAction {
  trigger: ('create' | 'update' | 'delete')[];
}

interface ResourceReference {
  /**
   * The name of the referenced resource.
   */
  resource: string;

  create?: ResourceReferenceAction;
  update?: ResourceReferenceAction;
  delete?: ResourceReferenceAction;
}

export interface Resource {
  /**
   * The definition for the `resource.create` action.
   */
  create?: ResourceCall;

  /**
   * The definition for the `resource.delete` action.
   */
  delete?: ResourceCall;

  /**
   * The definition for the `resource.get` action.
   */
  get?: ResourceCall;

  /**
   * The definition for the `resource.query` action.
   */
  query?: ResourceCall;

  /**
   * The definition for the `resource.update` action.
   */
  update?: ResourceCall;

  /**
   * How to upload blobs.
   */
  blobs?: BlobUploadType;

  /**
   * The property to use as the id.
   *
   * @default `id`
   */
  id?: number;

  /**
   * The JSON schema to validate resources against before sending it to the backend.
   */
  schema?: OpenAPIV3.SchemaObject;

  /**
   * The URL to post the resource to.
   *
   * @default autogenerated for use with the Appsemble resource API.
   */
  url?: string;

  /**
   * The references this resources has to other resources.
   */
  references?: { [property: string]: ResourceReference };
}

export interface BlobUploadType {
  type?: 'upload';
  method?: HTTPMethods;
  serialize?: 'custom';
  url?: string;
}

export interface BaseActionDefinition<T extends Action['type']> {
  /**
   * The element to use as the base when returning the response data.
   */
  base?: string;

  /**
   * The type of the action.
   */
  type: T;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   */
  remap?: string;
}

export interface DialogActionDefinition extends BaseActionDefinition<'dialog'> {
  /**
   * If false, the dialog cannot be closed by clicking outside of the dialog or on the close button.
   */
  closable?: boolean;

  /**
   * If true, the dialog will be displayed full screen.
   */
  fullscreen?: boolean;

  /**
   * Blocks to render on the dialog.
   */
  blocks: Block[];

  /**
   * The title to show in the dialog.
   */
  title?: string;
}

export interface LinkActionDefinition extends BaseActionDefinition<'link'> {
  /**
   * Where to link to.
   *
   * This should be a page name.
   */
  to: string;

  /**
   * Parameters to use for formatting the link.
   */
  parameters?: { [key: string]: any };
}

export interface LogActionDefinition extends BaseActionDefinition<'log'> {
  /**
   * The logging level on which to log.
   *
   * @default `info`.
   */
  level?: LogAction['level'];
}

export interface RequestLikeActionDefinition<
  T extends RequestLikeActionTypes = RequestLikeActionTypes
> extends BaseActionDefinition<T> {
  /**
   * The element to use as the base when returning the response data.
   */
  base?: string;

  /**
   * Specify how to handle blobs in the object to upload.
   */
  blobs?: BlobUploadType;

  /**
   * The HTTP method to use for making a request.
   */
  method?: HTTPMethods;

  /**
   * A JSON schema against which to validate data before uploading.
   */
  schema?: OpenAPIV3.SchemaObject;

  /**
   * Query parameters to pass along with the request.
   */
  query?: { [key: string]: string };

  /**
   * The URL to which to make the request.
   */
  url?: string;

  /**
   * How to serialize the request body.
   */
  serialize?: 'formdata';

  /**
   * An additional action to execute after the request has succeeded.
   */
  onSuccess?: ActionDefinition;
  /**
   * An additional action to execute after the request has resulted in an error.
   */
  onError?: ActionDefinition;
}

export interface ResourceActionDefinition<T extends RequestLikeActionTypes>
  extends RequestLikeActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;
}

export type RequestActionDefinition = RequestLikeActionDefinition<'request'>;
export type ResourceCreateActionDefinition = ResourceActionDefinition<'resource.create'>;
export type ResourceDeleteActionDefinition = ResourceActionDefinition<'resource.delete'>;
export type ResourceGetActionDefinition = ResourceActionDefinition<'resource.get'>;
export type ResourceQueryActionDefinition = ResourceActionDefinition<'resource.query'>;
export type ResourceUpdateActionDefinition = ResourceActionDefinition<'resource.update'>;

export interface BaseResourceSubscribeActionDefinition<T extends Action['type']>
  extends BaseActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;

  /**
   * The action to subscribe to. Defaults to `update` if not specified.
   */
  action?: 'create' | 'update' | 'delete';
}

export type ResourceSubscribeActionDefinition = BaseResourceSubscribeActionDefinition<
  'resource.subscription.subscribe'
>;

export type ResourceUnsubscribeActionDefinition = BaseResourceSubscribeActionDefinition<
  'resource.subscription.unsubscribe'
>;

export type ResourceSubscriptionToggleActionDefinition = BaseResourceSubscribeActionDefinition<
  'resource.subscription.toggle'
>;

export type ResourceSubscriptionStatusActionDefinition = Omit<
  BaseResourceSubscribeActionDefinition<'resource.subscription.status'>,
  'action'
>;

export interface EventActionDefinition extends BaseActionDefinition<'event'> {
  /**
   * The name of the event to emit to.
   */
  event: string;
}

export interface StaticActionDefinition extends BaseActionDefinition<'static'> {
  /**
   * The value to return.
   */
  value: any;
}

export type ActionDefinition =
  | BaseActionDefinition<'flow.back'>
  | BaseActionDefinition<'flow.cancel'>
  | BaseActionDefinition<'flow.finish'>
  | BaseActionDefinition<'flow.next'>
  | BaseActionDefinition<'noop'>
  | DialogActionDefinition
  | EventActionDefinition
  | LinkActionDefinition
  | LogActionDefinition
  | RequestActionDefinition
  | ResourceCreateActionDefinition
  | ResourceDeleteActionDefinition
  | ResourceGetActionDefinition
  | ResourceQueryActionDefinition
  | ResourceUpdateActionDefinition
  | ResourceSubscribeActionDefinition
  | ResourceUnsubscribeActionDefinition
  | ResourceSubscriptionToggleActionDefinition
  | ResourceSubscriptionStatusActionDefinition
  | StaticActionDefinition

  // XXX This shouldn’t be here, but TypeScript won’t shut up without it.
  | RequestLikeActionDefinition;

export interface ActionType {
  /**
   * Whether or not app creators are required to define this action.
   */
  required?: boolean;
}

export interface BlockManifest {
  /**
   * A block manifest as it is available to the app and in the SDK.
   * pattern: ^@[a-z]([a-z\d-]{0,30}[a-z\d])?\/[a-z]([a-z\d-]{0,30}[a-z\d])$
   * The name of a block.
   */
  name: string;

  /**
   * The description of the block.
   */
  description?: string;

  /**
   * A [semver](https://semver.org) representation of the block version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * The type of layout to be used for the block.
   */
  layout?: 'float' | 'static' | 'grow' | 'hidden' | null;

  /**
   * Array of urls associated to the files of the block.
   */
  files: string[];

  /**
   * The actions that are supported by a block.
   */
  actions?: { [key: string]: ActionType };

  /**
   * The events that are supported by a block.
   */
  events?: {
    listen?: string[];
    emit?: string[];
  };

  /**
   * A JSON schema to validate block parameters.
   *
   * Since multiple JSON schema typings exist and not all of them play nice with each other, this
   * type is set to `object`.
   */
  parameters?: object;

  /**
   * @deprecated
   */
  resources?: null;
}

/**
 * This describes what a page will look like in the app.
 */
export interface BasePage {
  /**
   * The name of the page.
   *
   * This will be displayed on the top of the page and in the side menu.
   */
  name: string;

  /**
   * A list of roles that may view the page.
   */
  roles?: string[];

  /**
   * An optional icon from the fontawesome icon set
   *
   * This will be displayed in the navigation menu.
   */
  icon?: IconName;

  /**
   * Page parameters can be used for linking to a page that should display a single resource.
   */
  parameters?: string[];

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: { [key: string]: ActionDefinition };

  /**
   * The global theme for the page.
   */
  theme?: Partial<Theme>;

  /**
   * The navigation type to use.
   *
   * If this is omitted, a collapsable side navigation menu will be rendered on the left.
   */
  navigation?: Navigation;

  /**
   * Whether or not the page should be displayed in navigational menus.
   */
  hideFromMenu?: boolean;
}

interface SubPage {
  name: string;
  blocks: Block[];
}

export interface BasicPage extends BasePage {
  type?: 'page';
  blocks: Block[];
}

export interface FlowPage extends BasePage {
  type: 'flow';
  subPages: SubPage[];
}

export interface TabsPage extends BasePage {
  type: 'tabs';
  subPages: SubPage[];
}

export type Page = BasicPage | FlowPage | TabsPage;

export interface AppDefinition {
  /**
   * The name of the app.
   *
   * This determines the default path of the app.
   */
  name?: string;

  /**
   * The description of the app.
   */
  description?: string;

  /**
   * The security definition of the app.
   *
   * This determines user roles and login behavior.
   */
  security?: Security;

  /**
   * A list of roles that are required to view pages. Specific page roles override this property.
   */
  roles?: string[];

  /**
   * The default page of the app.
   */
  defaultPage: string;

  /**
   * The navigation type to use.
   *
   * If this is omitted, a collapsable side navigation menu will be rendered on the left.
   */
  navigation?: Navigation;

  /**
   * The strategy to use for apps to subscribe to push notifications.
   *
   * If this is omitted, push notifications can not be sent.
   */
  notifications?: 'opt-in' | 'startup';

  /**
   * The pages of the app.
   */
  pages: Page[];

  /**
   * Resource definitions that may be used by the app.
   */
  resources?: { [key: string]: Resource };

  /**
   * The global theme for the app.
   */
  theme?: Partial<Theme>;
}

/**
 * The rating for an app.
 */
interface Rating {
  /**
   * The number of people who rated the app.
   */
  count: number;

  /**
   * THe average app rating.
   */
  average: number;
}

export interface App {
  /**
   * The unique identifier for the app.
   *
   * This value will be generated automatically by the API.
   */
  id?: number;

  /*
   * A domain name on which this app should be served.
   */
  domain?: string;

  /**
   * The id of the organization to which this app belongs.
   */
  OrganizationId?: string;

  path: string;
  private: boolean;

  definition: AppDefinition;

  /**
   * The app definition formatted as YAML.
   */
  yaml: string;

  /**
   * An app rating.
   */
  rating?: Rating;

  /**
   * An app icon url
   */
  iconUrl?: string;

  $created?: string;

  $updated?: string;
}

/**
 * A rating given to an app.
 */
export interface Rating {
  /**
   * A value ranging between 1 and 5 representing the rating
   */
  rating: number;

  /**
   * An optional description of why the rating was given
   */
  description?: string;

  /**
   * The name of the user who rated the app.
   */
  name: string;

  /**
   * The ID of the user who rated the app.
   */
  UserId: string;

  /**
   * The creation date of the rating.
   */
  $created: string;

  /**
   * The date of the last time the rating was updated
   */
  $updated: string;
}

/**
 * The representation of an organization within Appsemble.
 */
export interface Organization {
  /**
   * The ID of the organization.
   *
   * This typically is prepended with an `@`
   */
  id: string;

  /**
   * The display name of the organization.
   */
  name: string;
}

/**
 * A member of an app.
 */
export interface AppMember {
  id: number;
  name: string;
  primaryEmail: string;
  role: string;
}

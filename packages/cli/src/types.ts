import type { BlockManifest } from '@appsemble/types';
import type { PackageJson } from 'read-pkg-up';
import type { JsonObject } from 'type-fest';

/**
 * THe base arguments from the command line.
 *
 * See {@link ./index.js}.
 */
export interface BaseArguments {
  verbose?: number;
  quiet?: number;
  remote: string;
  clientCredentials?: string;
}

/**
 * The arguments passed to `appsemble app update`.
 *
 * See {@link ./commands/app/update.js}.
 */
export interface UpdateAppArguments extends BaseArguments {
  /**
   * The ID of the app to update.
   */
  appId: number;

  /**
   * The path in which the app YAML is located.
   */
  path: string;

  /**
   * Whether the app should be marked as private.
   */
  private: boolean;

  /**
   * Whether the app should be marked as a template.
   */
  template: boolean;
}

export interface BlockConfig
  extends Pick<
    BlockManifest,
    | 'name'
    | 'description'
    | 'longDescription'
    | 'actions'
    | 'events'
    | 'parameters'
    | 'resources'
    | 'version'
    | 'layout'
  > {
  /**
   * The path to the webpack configuration file relative to the block project directory.
   */
  webpack: string;

  /**
   * The build output directory relative to the block project directory.
   */
  output: string;

  /**
   * The absolute directory of the block project.
   */
  dir: string;
}

export interface MonoRepoPackageJson extends PackageJson {
  appsembleServer?: JsonObject;
}

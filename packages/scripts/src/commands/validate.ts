import { basename, dirname, join, relative } from 'path';

import { getWorkspaces, logger, opendirSafe } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import extractMessages from 'extract-react-intl-messages';
import { existsSync, readJson } from 'fs-extra';
import { isEqual } from 'lodash';
import normalizePath from 'normalize-path';
import semver from 'semver';
import { PackageJson } from 'type-fest';

export const command = 'validate';
export const description = 'Validate all workspaces have a proper configuration';

/**
 * A list of packages that are released without a scoped package name.
 */
const unscopedPackageNames = new Set(['appsemble', 'create-appsemble']);

/**
 * A representation of a yarn workspace.
 */
interface Workspace {
  /**
   * The absolute path to the workspace directory.
   */
  dir: string;

  /**
   * The contents of the package.json file in the workspace.
   */
  pkg: PackageJson;
}

/**
 * A validation result
 */
interface Result {
  /**
   * The filename to which the result applies.
   */
  filename: string;

  /**
   * The validation message.
   */
  message: string;

  /**
   * Checked on truthiness to see if the result is a pass or fail.
   */
  pass: any;

  /**
   * The workspace on which the result applies.
   */
  workspace: Workspace;
}

/**
 * Assert if a check fails or passes.
 *
 * @param assertion - Whether the assertion passed.
 * @param filename - On which file name the assertion applies.
 * @param message - A description of the assertion that was run.
 */
type Assert = (assertion: boolean, filename: string, message: string, workspace?: string) => void;

async function validateTranslations(assert: Assert): Promise<void> {
  const workspaces = ['app', 'react-components', 'studio'];
  const developerLocales = [defaultLocale, 'nl'].sort();
  const translations: Record<string, Record<string, string>> = {};

  await opendirSafe('./i18n', async (filepath, stat) => {
    if (stat.name === 'index.ts') {
      return;
    }

    if (!stat.isFile() || !filepath.endsWith('.json')) {
      assert(false, filepath, 'should be a json file');
      return;
    }

    const [language] = stat.name.split('.json');
    const messages = await readJson(filepath);
    translations[language] = messages;
  });

  const allLocales = [...new Set([...developerLocales, ...Object.keys(translations)])].sort();
  const translatedMessages = await extractMessages.extractReactIntl(
    allLocales,
    `./packages/@(${workspaces.join('|')})/src/**/messages.ts`,
    {
      format: 'json',
      flat: true,
      defaultLocale,
      overwriteDefault: true,
    },
  );

  for (const language of allLocales) {
    const path = `i18n/${language}.json`;
    const messages = translations[language];
    if (language === defaultLocale) {
      assert(
        isEqual(messages, translatedMessages[language]),
        path,
        `${defaultLocale} messages should be equal when extracted`,
      );
    }

    if (developerLocales.includes(language)) {
      const untranslatedMessages = Object.values(messages).filter((message) => !message);
      assert(untranslatedMessages.length === 0, path, 'Messages should be translated');
    } else {
      assert(
        isEqual(Object.keys(messages), Object.keys(translatedMessages[language]).sort()),
        path,
        'Keys should be the same',
      );
    }
  }
}

async function validate(
  assert: Assert,
  { dir, pkg }: Workspace,
  latestVersion: string,
): Promise<void> {
  /**
   * Validate package.json
   */
  const pkgNameMatch = pkg.name.match(/^(@(?<scope>[a-z-]+)\/)?(?<name>[a-z-]+[\da-z-]+)$/);
  assert(
    basename(dir) === pkgNameMatch?.groups.name,
    '',
    'Base directory should match package name',
  );
  assert(
    pkgNameMatch?.groups.scope === 'appsemble' ||
      unscopedPackageNames.has(pkgNameMatch?.groups.name),
    'package.json',
    'Name should use the @appsemble scope',
  );
  if (basename(dirname(dir)) !== 'blocks') {
    ['app', 'apps', 'framework', 'low-code', 'lowcode'].forEach((keyword) => {
      assert(
        pkg.keywords.includes(keyword),
        'package.json',
        `Keywords should at least contain ${keyword}`,
      );
    });
    assert(
      pkg.keywords.every((keyword, i) => !i || pkg.keywords[i - 1].localeCompare(keyword) < 0),
      'package.json',
      'Keywords should be sorted alphabetically',
    );
  }
  assert(
    pkg.version === latestVersion,
    'package.json',
    `Version should match latest version "${latestVersion}"`,
  );
  assert(typeof pkg.description === 'string', 'package.json', 'Description should be valid');
  assert(
    pkg.homepage === 'https://appsemble.app',
    'package.json',
    'Homepage should be "https://appsemble.app"',
  );
  assert(
    pkg.bugs === 'https://gitlab.com/appsemble/appsemble/issues',
    'package.json',
    'Bugs should be "https://gitlab.com/appsemble/appsemble/issues"',
  );
  assert(
    (pkg?.repository as any)?.type === 'git',
    'package.json',
    'Repository type should be "git"',
  );
  assert(
    (pkg?.repository as any)?.url === 'https://gitlab.com/appsemble/appsemble.git',
    'package.json',
    'Repository url should be "https://gitlab.com/appsemble/appsemble.git"',
  );
  assert(
    (pkg?.repository as any)?.directory === normalizePath(relative(process.cwd(), dir)),
    'package.json',
    `Repository directory should be "${normalizePath(relative(process.cwd(), dir))}"`,
  );
  assert(pkg.license === 'LGPL-3.0-only', 'package.json', 'License should be "LGPL-3.0-only"');
  assert(
    pkg.author === 'Appsemble <info@appsemble.com> (https://appsemble.com)',
    'package.json',
    'Author should be "Appsemble <info@appsemble.com> (https://appsemble.com)"',
  );
  assert(pkg.scripts?.test === 'jest', 'package.json', 'Test script should be "jest"');
  Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
    .filter(([dep]) => dep.startsWith('@appsemble/'))
    .forEach(([, version]) => {
      assert(
        version === latestVersion,
        'package.json',
        `Dependencies on Appsemble packages should depend on exactly "${latestVersion}"`,
      );
    });

  /**
   * Validate tsconfig.json
   */
  const tsConfig = await readJson(join(dir, 'tsconfig.json')).catch(() => null);
  assert(tsConfig, 'tsconfig.json', 'The workspace should have a TypeScript configuration');
  if (tsConfig) {
    assert(
      tsConfig.extends === '../../tsconfig',
      'tsconfig.json',
      'Should extend "../../tsconfig"',
    );
    assert(
      isEqual(Object.keys(tsConfig), ['extends', 'compilerOptions']),
      'tsconfig.json',
      'Only specifies "extends" and "compilerOptions" with "extends" first',
    );
  }

  /**
   * Validate tsconfig.build.json
   */
  const tsConfigBuild = await readJson(join(dir, 'tsconfig.build.json')).catch(() => null);
  if (!pkg.private) {
    assert(tsConfigBuild, 'tsconfig.build.json', 'Public projects should have tsconfig.build.json');
  }
  if (tsConfigBuild) {
    assert(
      tsConfigBuild.extends === '../../tsconfig.build',
      'tsconfig.build.json',
      'Should extend "../../tsconfig.build"',
    );
    assert(
      tsConfigBuild.compilerOptions?.rootDir === 'src',
      'tsconfig.build.json',
      'Root dir should be set to "src"',
    );
    assert(
      isEqual(Object.keys(tsConfigBuild), ['extends', 'compilerOptions']),
      'tsconfig.build.json',
      'Only specifies "extends" and "compilerOptions" with "extends" first',
    );
  }

  /**
   * Validate jest.config.js exists
   */
  assert(
    existsSync(join(dir, 'jest.config.js')),
    'jest.config.js',
    'Projects should have a Jest configuration',
  );
}

export async function handler(): Promise<void> {
  const results: Result[] = [];
  const paths = await getWorkspaces(process.cwd());
  const allWorkspaces: Workspace[] = await Promise.all(
    paths.map(async (dir) => ({
      dir,
      pkg: await readJson(join(dir, 'package.json')),
    })),
  );

  const workspaces = allWorkspaces
    .filter(({ pkg }) => !pkg.name.startsWith('@types/'))
    .sort((a, b) => a.dir.localeCompare(b.dir));

  const latestVersion = semver.maxSatisfying(
    workspaces.map(({ pkg }) => pkg.version),
    '*',
  );

  for (const workspace of workspaces) {
    await validate(
      (pass, filename, message) => results.push({ filename, message, pass, workspace }),
      workspace,
      latestVersion,
    );
  }

  await validateTranslations((pass, filename, message, workspace = '') =>
    results.push({
      filename,
      message,
      pass,
      workspace: { dir: workspace, pkg: '' as unknown as PackageJson },
    }),
  );

  const valid = results.filter(({ pass }) => pass);
  const invalid = results.filter(({ pass }) => !pass);

  valid.forEach(({ filename, message, workspace: { dir } }) => {
    logger.info(`✔️  ${relative(process.cwd(), join(dir, filename))}: ${message}`);
  });
  invalid.forEach(({ filename, message, workspace: { dir } }) => {
    logger.error(`❌ ${relative(process.cwd(), join(dir, filename))}: ${message}`);
    process.exitCode = 1;
  });
}

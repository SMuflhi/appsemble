import dns from './dns';

export default async function addDBHooks(db, argv) {
  if (!argv.appDomainStrategy) {
    return;
  }
  const { host } = new URL(argv.host);
  const dnsConfig = await dns(argv);
  if (!dnsConfig) {
    return;
  }
  db.models.App.afterSave('attachDomain', async app => {
    const oldDomain = app.previous('domain');
    const oldPath = app.previous('path');
    const newDomain = app.domain;
    const newPath = app.path;

    if (oldDomain !== newDomain) {
      if (newDomain) {
        if (oldDomain) {
          await dnsConfig.update(oldDomain, newDomain);
        } else {
          await dnsConfig.add(newDomain);
        }
      } else if (oldDomain) {
        await dnsConfig.remove(oldDomain);
      }
    }

    if (oldPath !== newPath) {
      if (oldPath) {
        await dnsConfig.update(
          `${oldPath}.${app.OrganizationId}.${host}`,
          `${newPath}.${app.OrganizationId}.${host}`,
        );
      } else {
        await dnsConfig.add(`${newPath}.${app.OrganizationId}.${host}`);
      }
    }
  });
}

import routing from '@novice1/routing';
import { apiReference } from '@scalar/express-api-reference';

export const scalarRouter = routing().use(
  //{ path: '/docs/scalar', parameters: { undoc: true } },
  '/docs/scalar',
  apiReference({
    url: '/docs/schema',
    theme: 'halloween',
    showSidebar: true,
    showDeveloperTools: 'never',
    showDefaultClientsWithSdkInstallation: false,
    pathRouting: {
      basePath: '/docs/scalar',
    },
  })
);

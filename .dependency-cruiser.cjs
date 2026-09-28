/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-infrastructure',
      severity: 'error',
      comment: 'Domain must not depend on infrastructure',
      from: { path: '^src/domain' },
      to: { path: '^src/infrastructure' },
    },
    {
      name: 'domain-no-presentation',
      severity: 'error',
      comment: 'Domain must not depend on presentation',
      from: { path: '^src/domain' },
      to: { path: '^src/presentation' },
    },
    {
      name: 'application-no-presentation',
      severity: 'error',
      comment: 'Application must not depend on presentation',
      from: { path: '^src/application' },
      to: { path: '^src/presentation' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  },
};

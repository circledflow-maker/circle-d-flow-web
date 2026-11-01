'use strict';
// Netlify ignore convention: 0 skips this build; 1 permits the normal build.
// Restrict this exception to previews of the coordination branch.
const preview = ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT);
const branch = process.env.HEAD || process.env.BRANCH || '';
process.exit(preview && branch === 'codex/repo-koordination-2026-10-28' ? 0 : 1);

'use strict';
// Skip previews whose Git snapshot is not a complete product-release baseline.
const guarded = new Set(['codex/repo-koordination-2026-10-28', 'codex/room-polish25-release-20261028']);
const preview = ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT);
const branch = process.env.HEAD || process.env.BRANCH || '';
process.exit(preview && guarded.has(branch) ? 0 : 1);

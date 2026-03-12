# Security Audit Baseline

Date: 2026-03-12

## Scope

- Command: `pnpm security:audit`
- Audit level: `high`
- Goal: establish a repeatable repo-local baseline for dependency risk before release work

## What Was Fixed

- Pinned `frontend` TypeScript to `4.9.5` for `react-scripts@5.0.1` compatibility.
- Upgraded direct `axios` dependency to `1.13.5`.
- Added root `pnpm.overrides` for several known vulnerable transitive packages where safe patch upgrades exist:
  - `glob`
  - `minimatch`
  - `multer`
  - `nth-check`
  - `rollup`

## Remaining High Findings

After the direct upgrade and safe overrides, the remaining high findings are concentrated in legacy build/dev toolchains rather than app runtime code.

Current notable upstream sources:

- `jsonpath` pulled through CRA's `bfj` chain (no patched version is published in the current advisory)
- `serialize-javascript` in webpack/terser chains used by build tooling
- remaining CRA-era transitive security findings tied to `react-scripts@5.0.1` / `@craco/craco@7.1.0`

## Interpretation

This audit is suitable as a repository baseline and makes direct/runtime dependencies safer, but it is not the same as a zero-finding dependency tree. Reaching zero high findings will require replacing or significantly upgrading the CRA-based frontend toolchain and some dev-tooling transitive chains.

## Repeat

```bash
pnpm security:audit
```

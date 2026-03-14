# Contributing to ProxmoxGuru

Thank you for taking the time to contribute. ProxmoxGuru is built by people who care about infrastructure tooling, and every improvement — no matter how small — makes a difference for the entire community of Proxmox users.

This document covers everything you need to go from zero to your first merged pull request.

---

## Table of Contents

1. [Project Philosophy](#project-philosophy)
2. [Ways to Contribute](#ways-to-contribute)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Code Style Guide](#code-style-guide)
6. [Adding a New Page](#adding-a-new-page)
7. [Adding a New Proxmox API Endpoint](#adding-a-new-proxmox-api-endpoint)
8. [Commit Message Convention](#commit-message-convention)
9. [Pull Request Process](#pull-request-process)
10. [Issue Reporting Guidelines](#issue-reporting-guidelines)

---

## Project Philosophy

ProxmoxGuru has three design principles that every contribution should serve:

1. **Performance over features.** A fast, reliable app that does fewer things is better than a bloated app that does everything slowly. New features should not regress perceived performance.

2. **Security is non-negotiable.** Proxmox credentials are sensitive. The IPC boundary between the Electron main process and the renderer is a hard security boundary. Never expose credentials, tokens, or raw API responses that contain secrets to the renderer process.

3. **The UI should feel like a premium tool.** The design system (colors, spacing, animation timing, component patterns) exists for a reason. New UI contributions should be indistinguishable from existing UI in style and quality.

---

## Ways to Contribute

### Bug Reports
Found something broken? [Open a bug report](https://github.com/proxmoxguru/proxmoxguru/issues/new?template=bug_report.yml). Good bug reports include steps to reproduce, expected vs actual behavior, and environment details.

### Feature Requests
Have an idea? [Open a feature request](https://github.com/proxmoxguru/proxmoxguru/issues/new?template=feature_request.yml). Describe the problem you're solving, not just the solution — the implementation might look different from what you imagined, and that's fine.

### Code Contributions
See the sections below. For anything beyond a small bugfix, please open an issue first so the approach can be discussed before you invest time writing code.

### Documentation
Documentation improvements are always welcome without prior discussion. If something is unclear, confusing, or missing, fix it.

### Translations
The app currently ships English-only. Internationalization infrastructure is planned. If you'd like to help with i18n, open a discussion first.

---

## Development Setup

### Prerequisites

- **Node.js** 18.0.0 or later (check with `node --version`)
- **npm** 9.0.0 or later (check with `npm --version`)
- **Git**
- A running Proxmox VE instance for testing (a free trial on a spare machine or VM works fine)

### Clone and Install

```bash
git clone https://github.com/proxmoxguru/proxmoxguru.git
cd proxmoxguru
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This starts Vite's dev server (port 5173) and the Electron process simultaneously via `concurrently`. The renderer hot-reloads on file changes. Electron restarts when main-process files change (you may need to use a tool like `nodemon` for main-process live reload, or simply restart manually).

### Other Useful Commands

```bash
# Type-check the renderer (strict mode)
npm run typecheck

# Type-check the main process (tsconfig.electron.json)
npx tsc -p tsconfig.electron.json --noEmit

# Lint
npm run lint

# Build the frontend only (no electron-builder)
npx vite build

# Package for your current platform
npm run build

# Package for a specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

---

## Project Structure

```
proxmoxguru/
├── electron/
│   ├── main.ts          # Electron main process: window creation, IPC handlers, Proxmox HTTP calls
│   └── preload.ts       # Context bridge: exposes safe IPC wrappers to the renderer
├── src/
│   ├── api/
│   │   └── proxmox.ts   # Proxmox API client (runs in main process, called via IPC)
│   ├── components/
│   │   ├── layout/      # AppLayout, Sidebar, TopBar, CommandPalette
│   │   └── ui/          # Reusable primitives: Button, Modal, DataTable, MetricCard,
│   │                    #   MetricChart, ProgressBar, StatusBadge, Toast
│   ├── hooks/
│   │   └── useProxmox.ts  # All TanStack React Query hooks for data fetching + mutations
│   ├── pages/           # One file per route: DashboardPage, NodesPage, VMsPage, etc.
│   ├── store/
│   │   ├── serverStore.ts  # Zustand: server list, active server, connection status
│   │   └── uiStore.ts      # Zustand: sidebar state, command palette, notifications
│   ├── types/
│   │   ├── proxmox.ts      # TypeScript types for all Proxmox API response shapes
│   │   └── electron.d.ts   # Type declarations for window.electronAPI (the context bridge)
│   └── lib/
│       └── utils.ts        # Shared utility functions (formatBytes, formatUptime, cn, etc.)
├── docs/                # Extended documentation
├── .github/             # CI workflows, issue templates, PR template
├── tsconfig.json        # TypeScript config for the renderer (React/Vite)
├── tsconfig.electron.json  # TypeScript config for the main process (Node/CommonJS)
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration (custom colors, fonts)
└── package.json
```

---

## Code Style Guide

### TypeScript

- **Strict mode is required.** `tsconfig.json` enables `"strict": true`. All code must pass without `any` (use `unknown` and narrow it).
- Prefer `interface` for object shapes, `type` for unions and mapped types.
- Avoid type assertions (`as SomeType`) except when interfacing with untyped third-party code — and even then, add a comment explaining why.
- Export types from `src/types/` rather than co-locating them with components.

### React Components

- All components are function components. No class components.
- Component names are **PascalCase**. Files match the component name: `Button.tsx`, `MetricCard.tsx`.
- One component per file (internal helpers are acceptable as unexported functions in the same file).
- Props interfaces are named `ComponentNameProps` and defined immediately before the component.
- Use `React.FC` sparingly — prefer explicit return type annotations when the component has complex generics, plain inference otherwise.

### Styling (Tailwind CSS)

- Use Tailwind utility classes directly in JSX. Do not write custom CSS unless absolutely necessary.
- Use the design-system color palette defined in `tailwind.config.js`. Do not use arbitrary hex values inline.
- For conditional classes, use the `cn()` helper from `src/lib/utils.ts` (which wraps `clsx` + `tailwind-merge`).
- Animation with Framer Motion: use `motion.*` variants for entrance/exit animations. Keep `duration` values between 0.15s and 0.4s to feel snappy.

### Design System Colors

| Token | Value | Use |
|-------|-------|-----|
| `bg-app-black` | `#0B0B0F` | Application background |
| `neon-blue` | `#4DA3FF` | Primary accent, links, active states |
| `electric-purple` | `#7B61FF` | Secondary accent, gradients |
| `surface-dark` | `#13131A` | Card/panel backgrounds |
| `border-subtle` | `#1E1E2E` | Borders, dividers |

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `MetricCard` |
| Hooks | camelCase, `use` prefix | `useNodes`, `useVMAction` |
| Zustand stores | camelCase, `use` prefix | `useServerStore`, `useUIStore` |
| IPC channel names | `kebab-case` | `proxmox:get-nodes` |
| Type names | PascalCase | `ProxmoxNode`, `VMStatus` |
| Utility functions | camelCase | `formatBytes`, `formatUptime` |
| Files (components) | PascalCase | `MetricChart.tsx` |
| Files (other) | camelCase | `proxmox.ts`, `useProxmox.ts` |

---

## Adding a New Page

Follow these steps to add a new top-level page (e.g., a "Snapshots" page):

### 1. Create the page component

Create `src/pages/SnapshotsPage.tsx`:

```tsx
import React from 'react';

const SnapshotsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-white">Snapshots</h1>
      {/* Page content */}
    </div>
  );
};

export default SnapshotsPage;
```

### 2. Add the route in `src/App.tsx` (or your router configuration)

```tsx
import SnapshotsPage from './pages/SnapshotsPage';

// Inside <Routes>:
<Route path="/snapshots" element={<SnapshotsPage />} />
```

### 3. Add a sidebar entry in `src/components/layout/Sidebar.tsx`

```tsx
{ icon: Camera, label: 'Snapshots', path: '/snapshots', shortcut: '⌘0' },
```

### 4. Register the keyboard shortcut in `src/components/layout/AppLayout.tsx`

Find the keyboard shortcut handler and add:

```ts
case '0':
  navigate('/snapshots');
  break;
```

### 5. Add to the command palette in `src/components/layout/CommandPalette.tsx`

Add a navigation command entry for "Snapshots" so it appears in ⌘K results.

### 6. Update `docs/KEYBOARD_SHORTCUTS.md`

Document the new shortcut.

---

## Adding a New Proxmox API Endpoint

This is the most common code contribution. Follow each step in order — they form a complete chain from the Proxmox API to your React component.

The example below adds a "get VM snapshots" endpoint.

### Step 1: Add the API call in `src/api/proxmox.ts`

This file runs in the Electron main process. Add a typed function:

```ts
export async function getVMSnapshots(
  host: string,
  token: string,
  node: string,
  vmid: number
): Promise<ProxmoxSnapshot[]> {
  const response = await axios.get(
    `${host}/api2/json/nodes/${node}/qemu/${vmid}/snapshot`,
    { headers: { Authorization: `PVEAPIToken=${token}` } }
  );
  return response.data.data;
}
```

### Step 2: Add an IPC handler in `electron/main.ts`

```ts
ipcMain.handle('proxmox:get-vm-snapshots', async (_event, { host, token, node, vmid }) => {
  return proxmoxApi.getVMSnapshots(host, token, node, vmid);
});
```

### Step 3: Expose the channel in `electron/preload.ts`

```ts
getVMSnapshots: (params: { host: string; token: string; node: string; vmid: number }) =>
  ipcRenderer.invoke('proxmox:get-vm-snapshots', params),
```

### Step 4: Declare the type in `src/types/electron.d.ts`

Add to the `ElectronAPI` interface:

```ts
getVMSnapshots: (params: { host: string; token: string; node: string; vmid: number }) =>
  Promise<ProxmoxSnapshot[]>;
```

### Step 5: Add the response type in `src/types/proxmox.ts`

```ts
export interface ProxmoxSnapshot {
  name: string;
  description: string;
  snaptime?: number;
  vmstate: number;
  parent?: string;
}
```

### Step 6: Add a React Query hook in `src/hooks/useProxmox.ts`

```ts
export function useVMSnapshots(node: string, vmid: number) {
  const { activeServer } = useServerStore();

  return useQuery({
    queryKey: ['vm-snapshots', activeServer?.id, node, vmid],
    queryFn: () =>
      window.electronAPI.getVMSnapshots({
        host: activeServer!.host,
        token: activeServer!.token,
        node,
        vmid,
      }),
    enabled: !!activeServer && !!node && !!vmid,
    staleTime: 30_000,
  });
}
```

### Step 7: Use the hook in your component

```tsx
const { data: snapshots, isLoading } = useVMSnapshots(node, vmid);
```

That's the full chain. Every new endpoint follows the same pattern.

---

## Commit Message Convention

ProxmoxGuru uses [Conventional Commits](https://www.conventionalcommits.org/). This enables automatic changelog generation and makes the git history useful.

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependency updates, CI changes |
| `ci` | CI configuration changes |

### Examples

```
feat(vms): add snapshot management page
fix(auth): handle expired API token gracefully with re-auth prompt
docs(contributing): add step-by-step API endpoint guide
chore(deps): update electron to 28.3.0
refactor(store): consolidate server and connection state into serverStore
```

Breaking changes: add `!` after the type and a `BREAKING CHANGE:` footer:

```
feat(ipc)!: rename all IPC channels to proxmox: namespace

BREAKING CHANGE: All IPC channel names now use the proxmox: prefix.
Update any external tooling or tests that reference old channel names.
```

---

## Pull Request Process

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/snapshot-management
   ```

2. **Make your changes.** Commit in logical, atomic units following the convention above.

3. **Verify your work before pushing:**
   ```bash
   npm run typecheck
   npm run lint
   npx vite build   # Ensure the frontend builds without errors
   ```

4. **Open a pull request** against `main`. Fill out the PR template completely — reviewers will not merge PRs with empty checklist items unless there's a clear explanation.

5. **Respond to review feedback.** Push fixup commits to the same branch; do not force-push after a review has started.

6. **Squash and merge** is the preferred merge strategy for most PRs. The maintainer will squash if needed.

### PR Acceptance Criteria

- TypeScript passes with no errors
- The UI matches the existing design system in color, spacing, and interaction patterns
- No `console.error` or `console.warn` output in normal operation
- New IPC channels follow the `proxmox:verb-noun` naming convention
- Any new user-facing text is English and proofread
- Documentation is updated if the change affects user behavior or the API surface

---

## Issue Reporting Guidelines

### Before Opening an Issue

- Search [existing issues](https://github.com/proxmoxguru/proxmoxguru/issues) — your issue may already be reported or fixed
- Check the [Discussions](https://github.com/proxmoxguru/proxmoxguru/discussions) for general questions

### Bug Reports

Use the [bug report template](https://github.com/proxmoxguru/proxmoxguru/issues/new?template=bug_report.yml). Include:

- **Exact steps to reproduce** — "it doesn't work" is not actionable
- **What you expected to happen** vs **what actually happened**
- **App version** (shown in Settings → About)
- **OS and version** (e.g., macOS 14.3, Windows 11, Ubuntu 22.04)
- **Proxmox VE version** (e.g., 8.1)
- **Electron/Node versions** if building from source (`electron --version`, `node --version`)
- Screenshots or screen recordings if the issue is visual

### Security Issues

**Do not open a public issue for security vulnerabilities.** See [SECURITY.md](SECURITY.md) for the private disclosure process.

### Feature Requests

Use the [feature request template](https://github.com/proxmoxguru/proxmoxguru/issues/new?template=feature_request.yml). Describe the problem you're trying to solve — the best features come from real pain points, not abstract wishes.

---

Thank you for contributing to ProxmoxGuru.

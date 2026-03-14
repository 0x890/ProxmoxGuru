# Changelog

All notable changes to ProxmoxGuru will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Snapshot management (create, delete, rollback) for VMs and containers
- Console access via noVNC embedded in the app
- Bulk VM/container operations (mass start, stop, migrate)
- Internationalization (i18n) infrastructure with initial translations
- Notification center with persistent history
- Dark/light theme toggle
- Cluster resource pool management
- VM/container creation wizard
- Custom dashboard widget layout (drag-and-drop)
- Auto-update via electron-updater

---

## [0.1.0] - 2026-03-14

Initial public release of ProxmoxGuru.

### Added

#### Core Application
- Electron 28 desktop shell with React 18 renderer
- TypeScript 5 strict-mode throughout renderer and main process
- Vite 5 build pipeline with hot-reload in development mode
- Cross-platform packaging via electron-builder: macOS (.dmg, x64 + arm64), Windows (.exe NSIS), Linux (.AppImage + .deb)
- Context isolation architecture: `contextIsolation: true`, `nodeIntegration: false`
- macOS native title bar with traffic light button support and custom drag region

#### Connection Manager
- Multi-server connection manager supporting unlimited Proxmox VE instances
- API token authentication (recommended): token ID + secret stored encrypted at rest
- Username/password authentication with automatic ticket renewal
- Per-server SSL verification toggle (for self-signed certificates in lab environments)
- Encrypted credential storage via electron-store (OS-level encryption)
- Server list persisted across sessions; credentials never exposed to the renderer process

#### Dashboard
- Real-time cluster overview with animated metric charts (Recharts + Framer Motion)
- CPU utilization sparkline across all nodes, updating every 30 seconds
- Memory utilization bar chart per node
- Network I/O chart (ingress + egress) per node
- Summary cards: total VMs, containers, storage pools, running/stopped counts
- Cluster health indicator with per-node status badges
- Framer Motion page transition animations on all route changes

#### Node Management
- Full cluster node list with status, CPU cores, memory, uptime
- Per-node hardware breakdown: CPU model, socket count, total RAM
- Node health indicators (online/offline/unknown) with color-coded status badges
- Active task count per node
- Expandable node detail view with live metric charts

#### VM Management (QEMU)
- Full VM inventory with search, filter by status (running/stopped/paused), and sort
- VM detail: CPU cores, memory allocation, disk size, network interfaces, uptime
- Power actions: start, stop, reboot, shutdown (graceful), suspend, resume
- Status badges with animated pulse for running VMs
- Per-VM CPU and memory sparklines

#### Container Management (LXC)
- Full LXC container inventory with the same search/filter/sort as VMs
- Container detail: CPU, memory, rootfs size, network, uptime, OS template
- Power actions: start, stop, reboot, shutdown
- Status badges matching the VM design system

#### Storage Management
- Storage pool list across all nodes: name, type (ZFS, LVM, NFS, CIFS, dir, btrfs), status
- Usage visualization: capacity, used, available with progress bar
- Content-type breakdown: images, backups, ISO templates, containers, snippets
- Per-datastore status (active/inactive/disabled)

#### Networking
- Network interface list per node: name, type, address, gateway, bridge ports
- Interface type badges (bridge, bond, eth, VLAN)
- Status indicators (active/inactive)

#### Backup Management
- Backup job list with schedule, target storage, included VMs/containers
- Backup log viewer per job
- Last run status and next scheduled run

#### Tasks Monitor
- Live cluster task log with real-time status updates
- Task columns: type, node, object (VM/container ID), user, status, start time, duration
- Status-based color coding: running (blue), OK (green), error (red), warning (amber)
- Auto-refresh every 10 seconds while the Tasks page is active

#### Logs Viewer
- Node syslog viewer with level-based filtering (info, notice, warning, error)
- Proxmox cluster log viewer
- Log line timestamps with timezone display
- Filter by log level and search by text

#### Settings
- Application version display
- Server management (add, edit, delete, reorder)
- Connection timeout configuration
- Refresh interval configuration
- SSL verification defaults

#### UI / Design System
- Futuristic dark theme: deep black (#0B0B0F) base, neon blue (#4DA3FF) primary accent, electric purple (#7B61FF) secondary accent
- Tailwind CSS 3 utility-first styling
- Reusable component library: `Button`, `Modal`, `DataTable`, `MetricCard`, `MetricChart`, `ProgressBar`, `StatusBadge`, `Toast`
- Toast notification system for async operation feedback
- Framer Motion animations on all interactive elements and page transitions
- Lucide React icon set throughout

#### Navigation
- Collapsible sidebar with page icons, labels, and active state indicators
- Top bar with server selector, connection status, and notification area
- Raycast-style command palette (⌘K / Ctrl+K): fuzzy search across pages, VMs, containers, and actions
- Keyboard shortcuts ⌘1–⌘9 / Ctrl+1–Ctrl+9 for direct page navigation
- Arrow key navigation in command palette, Enter to confirm, Escape to dismiss

#### Developer Experience
- TypeScript strict mode with separate tsconfig for renderer and main process
- ESLint configuration for `.ts` and `.tsx` files
- TanStack React Query v5 for all data fetching with automatic background refresh
- Zustand for client-side state: `serverStore` (connections) and `uiStore` (UI state)
- IPC channel naming convention: `proxmox:verb-noun`
- GitHub Actions CI: type-check + frontend build on every push and PR
- GitHub Actions release workflow: parallel builds for macOS, Windows, Linux on version tags
- Full contributing guide, architecture documentation, Proxmox setup guide

---

[Unreleased]: https://github.com/proxmoxguru/proxmoxguru/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/proxmoxguru/proxmoxguru/releases/tag/v0.1.0

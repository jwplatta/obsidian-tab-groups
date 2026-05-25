# Tab Groups

Chrome-style tab groups for [Obsidian](https://obsidian.md). Create named, color-coded groups of tabs, open and close them as a unit, and persist your workspace across sessions.

## Features

- **Named groups** — create a group from your current open tabs and give it a name
- **Color coding** — each group gets a unique color shown as a top stripe on tab headers and a pill label in the tab bar
- **Open and close** — open a group's tabs alongside your existing ones, or close them as a unit without deleting the group
- **Drag support** — drag a tab between two tabs of the same group to join it; drag it away from the group to remove it
- **Sidebar panel** — manage all groups from a dedicated sidebar view with open, close, rename, and delete actions per group
- **Right-click menu** — add or remove a tab from a group directly from the tab header context menu
- **Command palette** — all actions available as commands
- **Persistent** — groups are saved to `.obsidian/plugins/tab-groups/data.json` and restored on reload
- **Settings tab** — rename groups, change colors, and delete groups from the plugin settings page

## Installation

### Community plugins

Search for **Tab Groups** in **Settings → Community plugins → Browse**.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [Releases](https://github.com/jwplatta/obsidian-tab-groups/releases) page.
2. Copy them to `.obsidian/plugins/tab-groups/` in your vault.
3. Enable the plugin in **Settings → Community plugins**.

## Commands

All commands are prefixed with **Tab Groups** in the command palette.

| Command | Description |
|---------|-------------|
| Create group from current tabs | Capture all open tabs into a new named group |
| Open group... | Open a group's tabs alongside your existing tabs |
| Close group (keep saved)... | Close a group's tabs without deleting the group |
| Add current tab to group... | Add the active tab to an existing group |
| Remove current tab from its group | Remove the active tab from its group |
| Delete group... | Permanently delete a group |

## Usage

### Creating a group

1. Open the files you want in the group.
2. Run **Create group from current tabs** from the command palette and give it a name.
3. A colored label chip appears in the tab bar and a colored stripe on each tab header.

### Opening and closing groups

- **Open group** — opens a saved group's tabs alongside whatever you currently have open. New tabs are appended at the end of the tab strip.
- **Close group** — closes the group's tabs without removing the group. Reopen them any time with **Open group**.

### Managing tabs in a group

- **Drag** a tab between two tabs of the same group to add it to that group.
- **Drag** a tab away from its group neighbors to remove it.
- **Right-click** any tab header and choose **Add to tab group** or **Remove from "..."**.
- Use **Add current tab to group...** or **Remove current tab from its group** from the command palette.

### Sidebar

Click the layers icon in the ribbon to open the Tab Groups sidebar. From there you can:
- Open or close a group's tabs
- Rename a group (click ✎)
- Delete a group (click 🗑)

### Settings

Go to **Settings → Tab Groups** to change a group's color or rename/delete groups.

## Development

```bash
npm install
npm run build
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)

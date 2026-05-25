# Obsidian Tab Groups

Chrome-style tab groups for [Obsidian](https://obsidian.md). Create named, color-coded groups of tabs, switch between them, and persist your workspace across sessions.

## Features

- **Named groups** — create a group from your current open tabs and give it a name
- **Color coding** — each group gets a unique color shown as a top stripe on tab headers and a label chip in the tab bar
- **Switch, open, close** — switch to a group (replaces all open tabs), open a group's tabs alongside existing ones, or close a group's tabs without deleting the group
- **Drag support** — drag a tab between two tabs in the same group to join it; drag it away to remove it
- **Sidebar panel** — manage all groups from a dedicated sidebar view, with reorder (↑/↓), rename, and delete
- **Right-click menu** — add or remove the active tab from a group directly from the tab header context menu
- **Command palette** — all actions are available as commands
- **Persistent** — groups are saved to `.obsidian/plugins/obsidian-tab-groups/data.json` and restored on reload
- **Settings tab** — rename groups, change colors, and delete groups from the plugin settings page

## Installation

### Manual

1. Download the latest release assets (`main.js`, `manifest.json`, `styles.css`) from the [Releases](https://github.com/jwplatta/obsidian-tab-groups/releases) page.
2. Copy them to your vault at `.obsidian/plugins/obsidian-tab-groups/`.
3. Enable the plugin in **Settings → Community plugins**.

### Local development install

```bash
bin/install-local.sh                        # installs to ~/Documents/development_vault
bin/install-local.sh /path/to/your/vault    # installs to a custom vault path
```

## Commands

| Command | Description |
|---------|-------------|
| Create tab group from current tabs | Capture all open tabs into a new named group |
| Switch to tab group... | Replace all open tabs with a saved group |
| Open tab group... | Open a group's tabs alongside existing ones |
| Close tab group (keep saved)... | Close a group's tabs without deleting the group |
| Add current tab to group... | Add the active tab to an existing group |
| Remove current tab from its group | Remove the active tab from whichever group it belongs to |
| Delete tab group... | Permanently delete a group |

## Usage

1. Open several files in Obsidian.
2. Run **Create tab group from current tabs** and give the group a name.
3. Open a different set of files, create another group.
4. Use **Switch to tab group** (or click ⏎ in the sidebar) to jump between workspaces.
5. Right-click any tab header to add it to an existing group or create a new one.

## Development

```bash
npm install
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)

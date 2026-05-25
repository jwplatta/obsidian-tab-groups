# Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

## Development Setup

**Prerequisites:** Node.js 16+, npm

```bash
git clone https://github.com/jwplatta/obsidian-tab-groups.git
cd obsidian-tab-groups
npm install
```

## Building

```bash
npm run build       # production build → main.js
```

## Local Testing

Copy the built plugin into a development vault:

```bash
bin/install-local.sh                        # uses ~/Documents/development_vault
bin/install-local.sh /path/to/your/vault    # custom vault path
```

Then in Obsidian: **Settings → Community plugins → Reload** (or restart Obsidian).

## Project Structure

```
src/
  main.ts                    # Plugin entry point, commands, event registration
  types.ts                   # Core data structures (TabGroup, TabGroupLeaf, etc.)
  TabGroupsManager.ts        # Business logic: create/switch/open/close/delete/reorder
  TabGroupsColorManager.ts   # CSS injection, tab header coloring, drag detection
  TabGroupsSidebarView.ts    # Obsidian ItemView wrapper for the React sidebar
  modals.ts                  # Command palette modals (FuzzySuggestModal subclasses)
  settings.ts                # Plugin settings tab
  components/
    TabGroupsSidebar.tsx     # React root component
    TabGroupList.tsx         # Group list
    TabGroupItem.tsx         # Single group row with actions
    CreateGroupForm.tsx      # Name input + create button
    index.ts                 # Barrel exports
styles.css                   # Plugin styles
bin/
  install-local.sh           # Local dev install helper
```

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Match the existing TypeScript and React style
- Test manually in Obsidian before submitting
- Update `README.md` if you add or change user-facing behavior

## Reporting Issues

Please include:
- Obsidian version
- Plugin version
- Steps to reproduce
- What you expected vs. what happened

# Contributing

## Development Setup

1. Install Node.js 16+ and npm.
2. Install dependencies:

```bash
npm install
```

3. Build the plugin:

```bash
npm run build
```

4. Install into a development vault:

```bash
bin/install-local.sh                        # uses ~/Documents/development_vault
bin/install-local.sh /path/to/your/vault    # custom vault path
```

Then reload the plugin in **Obsidian → Settings → Community plugins**.

## Workflow

1. Start from a focused branch named `feature/...`, `fix/...`, `chore/...`, or `refactor/...`.
2. Keep changes targeted. Do not mix unrelated cleanup into the same branch.
3. Update `README.md` for any user-facing behavior changes.
4. Use [conventional commits](https://www.conventionalcommits.org/) — for example:
   - `feat: add group reorder buttons to sidebar`
   - `fix: prevent tabs joining group on adjacent drop`
   - `chore: update esbuild config`
5. Use semantic versioning for releases: patch for fixes, minor for new features, major for breaking changes.
6. Run a build and manually test in Obsidian before opening a pull request.

## Running Checks

```bash
npm run build    # TypeScript type-check + esbuild bundle
```

## Project Structure

```
src/
  main.ts                    # Plugin entry point, commands, event registration
  types.ts                   # Core data structures
  TabGroupsManager.ts        # Business logic: create/switch/open/close/delete/reorder
  TabGroupsColorManager.ts   # CSS injection, tab header coloring, drag detection
  TabGroupsSidebarView.ts    # Obsidian ItemView wrapper for the React sidebar
  modals.ts                  # Command palette modals
  settings.ts                # Plugin settings tab
  components/                # React components for the sidebar panel
styles.css                   # Plugin styles
bin/
  install-local.sh           # Local dev install helper
```

## Pull Requests

- Keep commits focused and intentional.
- Use conventional commit messages.
- Test manually in Obsidian before submitting.
- Document any user-facing changes in `README.md`.

## Reporting Issues

Please include:
- Obsidian version
- Plugin version
- Steps to reproduce
- What you expected vs. what happened

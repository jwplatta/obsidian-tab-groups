import {Menu, Notice, Plugin, TAbstractFile, WorkspaceLeaf} from "obsidian";
import {DEFAULT_SETTINGS, TabGroupsSettingTab, TabGroupsSettings} from "./settings";
import {TabGroupsManager} from "./TabGroupsManager";
import {TabGroupsColorManager} from "./TabGroupsColorManager";
import {TAB_GROUPS_SIDEBAR_VIEW_TYPE, TabGroupsSidebarView} from "./TabGroupsSidebarView";
import {AddToGroupModal, CreateGroupModal, DeleteGroupModal, SwitchGroupModal} from "./modals";

export default class TabGroupsPlugin extends Plugin {
	settings: TabGroupsSettings;
	manager: TabGroupsManager;
	colorManager: TabGroupsColorManager;

	async onload() {
		await this.loadSettings();

		this.manager = new TabGroupsManager(this.app, () => this.persistData());
		this.manager.loadData(this.settings.data);

		this.colorManager = new TabGroupsColorManager(this.app, this.manager, {
			onClose: (groupId) => {
				this.manager.closeGroup(groupId);
				this.colorManager.refresh(this.manager.getGroups());
				this.refreshSidebar();
			},
			onOpen: async (groupId) => {
				await this.manager.openGroup(groupId);
				this.colorManager.refresh(this.manager.getGroups());
				this.refreshSidebar();
			},
			onSwitch: async (groupId) => {
				await this.manager.switchToGroup(groupId);
				this.colorManager.refresh(this.manager.getGroups());
				this.refreshSidebar();
			},
			onDelete: (groupId) => {
				const group = this.manager.getGroups().find(g => g.id === groupId);
				this.manager.deleteGroup(groupId);
				this.colorManager.refresh(this.manager.getGroups());
				this.refreshSidebar();
				if (group) new Notice(`Tab group "${group.name}" deleted`);
			},
		});

		// Register sidebar view
		this.registerView(
			TAB_GROUPS_SIDEBAR_VIEW_TYPE,
			(leaf) => new TabGroupsSidebarView(leaf, this.manager, () => this.refreshSidebar())
		);

		// Ribbon icon to open sidebar
		this.addRibbonIcon("layers", "Tab Groups", () => this.activateSidebarView());

		// Commands
		this.addCommand({
			id: "create-tab-group",
			name: "Create group from current tabs",
			callback: () => {
				new CreateGroupModal(this.app, (name) => {
					this.manager.createGroup(name);
					this.colorManager.refresh(this.manager.getGroups());
					this.refreshSidebar();
					new Notice(`Tab group "${name}" created`);
				}).open();
			},
		});

		this.addCommand({
			id: "add-to-tab-group",
			name: "Add current tab to group...",
			callback: () => {
				const groups = this.manager.getGroups();
				const activeLeaf = this.app.workspace.activeLeaf;
				if (!activeLeaf) {
					new Notice("No active tab.");
					return;
				}
				if (groups.length === 0) {
					new Notice("No tab groups exist yet. Create one first.");
					return;
				}
				new AddToGroupModal(this.app, groups, (group) => {
					this.manager.addLeafToGroup(group.id, activeLeaf);
					this.colorManager.refresh(this.manager.getGroups());
					this.refreshSidebar();
					new Notice(`Tab added to "${group.name}"`);
				}).open();
			},
		});

		this.addCommand({
			id: "remove-from-tab-group",
			name: "Remove current tab from its group",
			callback: () => {
				const activeLeaf = this.app.workspace.activeLeaf;
				if (!activeLeaf) {
					new Notice("No active tab.");
					return;
				}
				const group = this.manager.getGroupForLeaf(activeLeaf);
				if (!group) {
					new Notice("Current tab is not in any group.");
					return;
				}
				this.manager.removeLeafFromGroup(activeLeaf);
				this.colorManager.refresh(this.manager.getGroups());
				this.refreshSidebar();
				new Notice(`Tab removed from "${group.name}"`);
			},
		});

		this.addCommand({
			id: "close-tab-group",
			name: "Close group (keep saved)...",
			callback: () => {
				const groups = this.manager.getGroups();
				if (groups.length === 0) { new Notice("No tab groups exist yet."); return; }
				new SwitchGroupModal(this.app, groups, (group) => {
					this.manager.closeGroup(group.id);
					this.colorManager.refresh(this.manager.getGroups());
					this.refreshSidebar();
					new Notice(`Tab group "${group.name}" closed`);
				}).open();
			},
		});

		this.addCommand({
			id: "open-tab-group",
			name: "Open group...",
			callback: () => {
				const groups = this.manager.getGroups();
				if (groups.length === 0) { new Notice("No tab groups exist yet."); return; }
				new SwitchGroupModal(this.app, groups, async (group) => {
					await this.manager.openGroup(group.id);
					this.colorManager.refresh(this.manager.getGroups());
					this.refreshSidebar();
				}).open();
			},
		});

		this.addCommand({
			id: "delete-tab-group",
			name: "Delete group...",
			callback: () => {
				const groups = this.manager.getGroups();
				if (groups.length === 0) {
					new Notice("No tab groups exist yet.");
					return;
				}
				new DeleteGroupModal(this.app, groups, (group) => {
					this.manager.deleteGroup(group.id);
					this.colorManager.refresh(this.manager.getGroups());
					this.refreshSidebar();
					new Notice(`Tab group "${group.name}" deleted`);
				}).open();
			},
		});

		// Right-click context menu on tabs
		this.registerEvent(
			this.app.workspace.on(
				"file-menu",
				(menu: Menu, _file: TAbstractFile, source: string, leaf?: WorkspaceLeaf) => {
					if (source !== "tab-header" && source !== "more-options") return;
					const targetLeaf = leaf ?? this.app.workspace.activeLeaf;
					if (!targetLeaf) return;

					menu.addSeparator();

					const groups = this.manager.getGroups();
					if (groups.length > 0) {
						menu.addItem(item => {
							item.setTitle("Add to tab group")
								.setIcon("plus-circle")
								.onClick(() => {
									new AddToGroupModal(this.app, groups, (group) => {
										this.manager.addLeafToGroup(group.id, targetLeaf);
										this.colorManager.refresh(this.manager.getGroups());
										this.refreshSidebar();
										new Notice(`Tab added to "${group.name}"`);
									}).open();
								});
						});
					}

					menu.addItem(item => {
						item.setTitle("Create new tab group")
							.setIcon("layers")
							.onClick(() => {
								new CreateGroupModal(this.app, (name) => {
									const state = targetLeaf.getViewState();
									const filePath = (state.state as Record<string, unknown>)?.["file"];
									const specificLeaves = typeof filePath === "string"
										? [{filePath, viewType: state.type}]
										: undefined;
									this.manager.createGroup(name, specificLeaves);
									this.colorManager.refresh(this.manager.getGroups());
									this.refreshSidebar();
									new Notice(`Tab group "${name}" created`);
								}).open();
							});
					});

					const existingGroup = this.manager.getGroupForLeaf(targetLeaf);
					if (existingGroup) {
						menu.addItem(item => {
							item.setTitle(`Remove from "${existingGroup.name}"`)
								.setIcon("minus-circle")
								.onClick(() => {
									this.manager.removeLeafFromGroup(targetLeaf);
									this.colorManager.refresh(this.manager.getGroups());
									this.refreshSidebar();
								});
						});
					}
				}
			)
		);

		// Refresh colors on layout change and active leaf change
		// Both events can cause Obsidian to re-render the tab bar DOM, wiping our injected labels
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.colorManager.refresh(this.manager.getGroups());
				this.refreshSidebar();
			})
		);
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.colorManager.refresh(this.manager.getGroups());
			})
		);

		// Initial color application once layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.colorManager.refresh(this.manager.getGroups());
		});

		this.addSettingTab(new TabGroupsSettingTab(this.app, this));
	}

	onunload() {
		this.colorManager.destroy();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TabGroupsSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async persistData(): Promise<void> {
		this.settings.data = this.manager.getData();
		await this.saveSettings();
	}

	refreshSidebar(): void {
		const leaves = this.app.workspace.getLeavesOfType(TAB_GROUPS_SIDEBAR_VIEW_TYPE);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof TabGroupsSidebarView) {
				view.refresh();
			}
		}
	}

	async activateSidebarView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(TAB_GROUPS_SIDEBAR_VIEW_TYPE);
		if (existing.length > 0 && existing[0]) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({type: TAB_GROUPS_SIDEBAR_VIEW_TYPE, active: true});
		this.app.workspace.revealLeaf(leaf);
	}
}

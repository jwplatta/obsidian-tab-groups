import {ItemView, WorkspaceLeaf} from "obsidian";
import {Root, createRoot} from "react-dom/client";
import React from "react";
import {TabGroupsSidebar} from "./components";
import {TabGroupsManager} from "./TabGroupsManager";

export const TAB_GROUPS_SIDEBAR_VIEW_TYPE = "tab-groups-sidebar";

export class TabGroupsSidebarView extends ItemView {
	private manager: TabGroupsManager;
	private onRefresh: () => void;
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf, manager: TabGroupsManager, onRefresh: () => void) {
		super(leaf);
		this.manager = manager;
		this.onRefresh = onRefresh;
	}

	getViewType(): string {
		return TAB_GROUPS_SIDEBAR_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Tab Groups";
	}

	getIcon(): string {
		return "layers";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		this.root = createRoot(container);
		this.render();
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
		this.root = null;
	}

	refresh(): void {
		this.render();
	}

	private render(): void {
		if (!this.root) return;
		const manager = this.manager;
		const onRefresh = this.onRefresh;

		this.root.render(
			React.createElement(TabGroupsSidebar, {
				groups: manager.getGroups(),
				activeGroupId: manager.getActiveGroupId(),
				onCreateGroup: (name: string) => {
					manager.createGroup(name);
					onRefresh();
				},
				onSwitchGroup: async (id: string) => {
					await manager.switchToGroup(id);
					onRefresh();
				},
				onCloseGroup: (id: string) => {
					manager.closeGroup(id);
					onRefresh();
				},
				onOpenGroup: async (id: string) => {
					await manager.openGroup(id);
					onRefresh();
				},
				onDeleteGroup: (id: string) => {
					manager.deleteGroup(id);
					onRefresh();
				},
				onRenameGroup: (id: string, name: string) => {
					manager.renameGroup(id, name);
					onRefresh();
				},
				onMoveGroupUp: (id: string) => {
					manager.reorderGroup(id, "up");
					onRefresh();
				},
				onMoveGroupDown: (id: string) => {
					manager.reorderGroup(id, "down");
					onRefresh();
				},
			})
		);
	}
}

import {App, Notice, TFile, WorkspaceLeaf} from "obsidian";
import {TabGroup, TabGroupLeaf, TabGroupsPluginData} from "./types";

const DEFAULT_COLORS = [
	"#e06c75",
	"#e5c07b",
	"#98c379",
	"#56b6c2",
	"#61afef",
	"#c678dd",
	"#d19a66",
	"#be5046",
];

export class TabGroupsManager {
	private app: App;
	private onDataChange: () => Promise<void>;
	private data: TabGroupsPluginData;
	/** True while we are programmatically detaching leaves — callers should suppress layout-change side-effects */
	isBusy = false;

	constructor(app: App, onDataChange: () => Promise<void>) {
		this.app = app;
		this.onDataChange = onDataChange;
		this.data = {groups: [], activeGroupId: null};
	}

	loadData(data: TabGroupsPluginData): void {
		this.data = JSON.parse(JSON.stringify(data)) as TabGroupsPluginData;
		this.deduplicateLeaves();
	}

	/** Remove any file path that appears in more than one group, keeping it only in the first group (by creation order). */
	private deduplicateLeaves(): void {
		const seen = new Set<string>();
		for (const group of this.data.groups) {
			group.leaves = group.leaves.filter(l => {
				if (seen.has(l.filePath)) return false;
				seen.add(l.filePath);
				return true;
			});
		}
	}

	getData(): TabGroupsPluginData {
		return JSON.parse(JSON.stringify(this.data)) as TabGroupsPluginData;
	}

	getGroups(): TabGroup[] {
		return [...this.data.groups];
	}

	getActiveGroupId(): string | null {
		return this.data.activeGroupId;
	}

	captureCurrentTabs(): TabGroupLeaf[] {
		const leaves: TabGroupLeaf[] = [];
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (leaf.getRoot() !== this.app.workspace.rootSplit) return;
			const state = leaf.getViewState();
			if (!state.type || state.type === "empty") return;
			const filePath = (state.state as Record<string, unknown>)?.["file"];
			if (typeof filePath === "string") {
				leaves.push({filePath, viewType: state.type});
			}
		});
		return leaves;
	}

	createGroup(name: string, specificLeaves?: TabGroupLeaf[]): TabGroup {
		const usedColors = new Set(this.data.groups.map(g => g.color));
		const color = DEFAULT_COLORS.find(c => !usedColors.has(c)) ?? DEFAULT_COLORS[this.data.groups.length % DEFAULT_COLORS.length] ?? "#61afef";

		const newLeaves = specificLeaves ?? this.captureCurrentTabs();
		const newFilePaths = new Set(newLeaves.map(l => l.filePath));

		// Remove these files from any existing group (enforce single membership)
		for (const g of this.data.groups) {
			g.leaves = g.leaves.filter(l => !newFilePaths.has(l.filePath));
		}

		const group: TabGroup = {
			id: crypto.randomUUID(),
			name,
			color,
			leaves: newLeaves,
			createdAt: Date.now(),
		};
		this.data.groups.push(group);
		void this.onDataChange();
		return group;
	}

	async switchToGroup(groupId: string): Promise<void> {
		if (this.data.activeGroupId === groupId) return;

		const group = this.data.groups.find(g => g.id === groupId);
		if (!group) return;

		// Snapshot main-area leaves then detach
		const currentLeaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (leaf.getRoot() === this.app.workspace.rootSplit) {
				currentLeaves.push(leaf);
			}
		});
		for (const leaf of currentLeaves) {
			leaf.detach();
		}

		// Open saved leaves
		for (let i = 0; i < group.leaves.length; i++) {
			const saved = group.leaves[i];
			if (!saved) continue;
			const leaf = i === 0
				? this.app.workspace.getLeaf(false)
				: this.app.workspace.getLeaf("tab" as Parameters<typeof this.app.workspace.getLeaf>[0]);

			if (saved.viewType === "markdown") {
				const file = this.app.vault.getAbstractFileByPath(saved.filePath);
				if (file instanceof TFile) {
					await leaf.openFile(file);
				} else {
					new Notice(`Tab Groups: file not found: ${saved.filePath}`);
				}
			} else {
				await leaf.setViewState({
					type: saved.viewType,
					state: {file: saved.filePath},
				});
			}
		}

		this.data.activeGroupId = groupId;
		await this.onDataChange();
	}

	deleteGroup(groupId: string): void {
		this.data.groups = this.data.groups.filter(g => g.id !== groupId);
		if (this.data.activeGroupId === groupId) {
			this.data.activeGroupId = null;
		}
		void this.onDataChange();
	}

	renameGroup(groupId: string, name: string): void {
		const group = this.data.groups.find(g => g.id === groupId);
		if (group) {
			group.name = name;
			void this.onDataChange();
		}
	}

	updateGroupColor(groupId: string, color: string): void {
		const group = this.data.groups.find(g => g.id === groupId);
		if (group) {
			group.color = color;
			void this.onDataChange();
		}
	}

	addLeafToGroup(groupId: string, leaf: WorkspaceLeaf): void {
		const group = this.data.groups.find(g => g.id === groupId);
		if (!group) return;
		const state = leaf.getViewState();
		const filePath = (state.state as Record<string, unknown>)?.["file"];
		if (typeof filePath !== "string") return;
		// Remove from any other group first (enforce single membership)
		for (const g of this.data.groups) {
			if (g.id !== groupId) {
				g.leaves = g.leaves.filter(l => l.filePath !== filePath);
			}
		}
		if (!group.leaves.some(l => l.filePath === filePath)) {
			group.leaves.push({filePath, viewType: state.type});
		}
		void this.onDataChange();
	}

	removeLeafFromGroup(leaf: WorkspaceLeaf): void {
		const state = leaf.getViewState();
		const filePath = (state.state as Record<string, unknown>)?.["file"];
		if (typeof filePath !== "string") return;
		for (const group of this.data.groups) {
			group.leaves = group.leaves.filter(l => l.filePath !== filePath);
		}
		void this.onDataChange();
	}

	reorderGroup(groupId: string, direction: "up" | "down"): void {
		const idx = this.data.groups.findIndex(g => g.id === groupId);
		if (idx === -1) return;
		const swapIdx = direction === "up" ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= this.data.groups.length) return;
		[this.data.groups[idx], this.data.groups[swapIdx]] = [this.data.groups[swapIdx]!, this.data.groups[idx]!];
		void this.onDataChange();
	}

	getGroupForLeaf(leaf: WorkspaceLeaf): TabGroup | null {
		const state = leaf.getViewState();
		const filePath = (state.state as Record<string, unknown>)?.["file"];
		if (typeof filePath !== "string") return null;
		return this.data.groups.find(g => g.leaves.some(l => l.filePath === filePath)) ?? null;
	}

	closeGroup(groupId: string): void {
		const group = this.data.groups.find(g => g.id === groupId);
		if (!group) return;
		const groupPaths = new Set(group.leaves.map(l => l.filePath));
		const toClose: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (leaf.getRoot() !== this.app.workspace.rootSplit) return;
			const state = leaf.getViewState();
			const filePath = (state.state as Record<string, unknown>)?.["file"];
			if (typeof filePath === "string" && groupPaths.has(filePath)) {
				toClose.push(leaf);
			}
		});
		for (const leaf of toClose) leaf.detach();
		if (this.data.activeGroupId === groupId) {
			this.data.activeGroupId = null;
		}
		void this.onDataChange();
	}

	async openGroup(groupId: string): Promise<void> {
		const group = this.data.groups.find(g => g.id === groupId);
		if (!group) return;

		// Find which files are already open so we don't duplicate
		const alreadyOpen = new Set<string>();
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (leaf.getRoot() !== this.app.workspace.rootSplit) return;
			const state = leaf.getViewState();
			const filePath = (state.state as Record<string, unknown>)?.["file"];
			if (typeof filePath === "string") alreadyOpen.add(filePath);
		});

		const toOpen = group.leaves.filter(l => !alreadyOpen.has(l.filePath));
		let first = true;
		for (const saved of toOpen) {
			const leaf = first
				? this.app.workspace.getLeaf(false)
				: this.app.workspace.getLeaf("tab" as Parameters<typeof this.app.workspace.getLeaf>[0]);
			// Only use getLeaf(false) if there are no other open leaves
			first = false;
			if (saved.viewType === "markdown") {
				const file = this.app.vault.getAbstractFileByPath(saved.filePath);
				if (file instanceof TFile) {
					await leaf.openFile(file);
				} else {
					new Notice(`Tab Groups: file not found: ${saved.filePath}`);
				}
			} else {
				await leaf.setViewState({type: saved.viewType, state: {file: saved.filePath}});
			}
		}

		this.data.activeGroupId = groupId;
		await this.onDataChange();
	}
}

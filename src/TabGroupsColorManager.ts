import {App, Menu, WorkspaceLeaf, WorkspaceTabs} from "obsidian";
import {TabGroup} from "./types";
import {TabGroupsManager} from "./TabGroupsManager";

const LABEL_CLASS = "tab-group-label";

export interface TabGroupLabelCallbacks {
	onClose: (groupId: string) => void;
	onOpen: (groupId: string) => void;
	onSwitch: (groupId: string) => void;
	onDelete: (groupId: string) => void;
}

type ContainerSnapshot = (string | null)[];

export class TabGroupsColorManager {
	private app: App;
	private styleEl: HTMLStyleElement | null = null;
	private callbacks: TabGroupLabelCallbacks;
	private manager: TabGroupsManager;
	private preDragSnapshots: Map<WorkspaceTabs, ContainerSnapshot> = new Map();
	private isDraggingNativeTab = false;

	constructor(app: App, manager: TabGroupsManager, callbacks: TabGroupLabelCallbacks) {
		this.app = app;
		this.manager = manager;
		this.callbacks = callbacks;
		document.addEventListener("dragstart", this.onNativeDragStart, true);
		document.addEventListener("dragend", this.onNativeDragEnd, true);
	}

	private onNativeDragStart = (evt: DragEvent): void => {
		const target = evt.target as HTMLElement;
		if (!target.closest(".workspace-tab-header")) return;
		this.isDraggingNativeTab = true;
		this.preDragSnapshots.clear();
		const containers: WorkspaceTabs[] = [];
		this.collectTabContainers(this.app.workspace.rootSplit, containers);
		for (const container of containers) {
			this.preDragSnapshots.set(container, this.snapshotContainer(container));
		}
	};

	private onNativeDragEnd = (): void => {
		if (!this.isDraggingNativeTab) return;
		this.isDraggingNativeTab = false;
		requestAnimationFrame(() => {
			this.processDragResult();
			this.preDragSnapshots.clear();
		});
	};

	private processDragResult(): void {
		const groups = this.manager.getGroups();
		const fileToGroup = new Map<string, TabGroup>();
		for (const group of groups) {
			for (const leaf of group.leaves) fileToGroup.set(leaf.filePath, group);
		}

		const containers: WorkspaceTabs[] = [];
		this.collectTabContainers(this.app.workspace.rootSplit, containers);

		for (const container of containers) {
			const before = this.preDragSnapshots.get(container) ?? [];
			const after = this.snapshotContainer(container);
			const draggedFile = this.findDraggedFile(before, after);
			if (!draggedFile) continue;

			const newIndex = after.indexOf(draggedFile);
			if (newIndex === -1) continue;

			const prevFile = newIndex > 0 ? after[newIndex - 1] ?? null : null;
			const nextFile = newIndex < after.length - 1 ? after[newIndex + 1] ?? null : null;
			const prevGroup = prevFile ? (fileToGroup.get(prevFile) ?? null) : null;
			const nextGroup = nextFile ? (fileToGroup.get(nextFile) ?? null) : null;
			const draggedLeafGroup = fileToGroup.get(draggedFile) ?? null;

			// Landed between two tabs of the same group → join
			if (prevGroup && nextGroup && prevGroup.id === nextGroup.id) {
				if (!draggedLeafGroup || draggedLeafGroup.id !== prevGroup.id) {
					const leaf = this.findLeafByFile(draggedFile);
					if (leaf) this.manager.addLeafToGroup(prevGroup.id, leaf);
				}
				continue;
			}

			// Was in a group, moved away from all its group neighbors → leave
			const oldIndex = before.indexOf(draggedFile);
			if (draggedLeafGroup && oldIndex !== -1) {
				const beforePrev = oldIndex > 0 ? before[oldIndex - 1] ?? null : null;
				const beforeNext = oldIndex < before.length - 1 ? before[oldIndex + 1] ?? null : null;
				const wasAdjacentBefore =
					(beforePrev && fileToGroup.get(beforePrev)?.id === draggedLeafGroup.id) ||
					(beforeNext && fileToGroup.get(beforeNext)?.id === draggedLeafGroup.id);
				const stillAdjacentAfter =
					(prevFile && fileToGroup.get(prevFile)?.id === draggedLeafGroup.id) ||
					(nextFile && fileToGroup.get(nextFile)?.id === draggedLeafGroup.id);

				if (wasAdjacentBefore && !stillAdjacentAfter) {
					const otherMembers = draggedLeafGroup.leaves.filter(l => l.filePath !== draggedFile);
					if (otherMembers.length > 0) {
						const leaf = this.findLeafByFile(draggedFile);
						if (leaf) this.manager.removeLeafFromGroup(leaf);
					}
				}
			}
		}

		this.refresh(this.manager.getGroups());
	}

	private findDraggedFile(before: ContainerSnapshot, after: ContainerSnapshot): string | null {
		for (const file of after) {
			if (file && !before.includes(file)) return file;
		}
		let bestFile: string | null = null;
		let bestDelta = 0;
		for (const file of after) {
			if (!file) continue;
			const idxBefore = before.indexOf(file);
			const idxAfter = after.indexOf(file);
			if (idxBefore === -1 || idxBefore === idxAfter) continue;
			const delta = Math.abs(idxAfter - idxBefore);
			if (delta > bestDelta) { bestDelta = delta; bestFile = file; }
		}
		return bestFile;
	}

	private findLeafByFile(filePath: string): WorkspaceLeaf | null {
		let found: WorkspaceLeaf | null = null;
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			if (found) return;
			if (this.getFilePath(leaf) === filePath) found = leaf;
		});
		return found;
	}

	private snapshotContainer(container: WorkspaceTabs): ContainerSnapshot {
		const children = (container as unknown as {children: WorkspaceLeaf[]}).children ?? [];
		return children.map(l => this.getFilePath(l));
	}

	refresh(groups: TabGroup[]): void {
		requestAnimationFrame(() => this._refresh(groups));
	}

	private _refresh(groups: TabGroup[]): void {
		const fileToGroup = new Map<string, TabGroup>();
		for (const group of groups) {
			for (const leaf of group.leaves) fileToGroup.set(leaf.filePath, group);
		}

		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			const filePath = (leaf.getViewState().state as Record<string, unknown>)?.["file"];
			const headerEl = (leaf as unknown as {tabHeaderEl?: HTMLElement}).tabHeaderEl;
			if (!headerEl) return;
			if (typeof filePath === "string" && fileToGroup.has(filePath)) {
				headerEl.dataset["tabGroup"] = fileToGroup.get(filePath)!.id;
			} else {
				delete headerEl.dataset["tabGroup"];
			}
		});

		if (!this.isDraggingNativeTab) {
			this.enforceAdjacency(groups, fileToGroup);
		}

		this.rebuildStyles(groups);

		// Don't re-inject labels during a native drag — Obsidian is mid-update
		if (!this.isDraggingNativeTab) {
			this.refreshLabels(groups);
		}
	}

	private enforceAdjacency(groups: TabGroup[], fileToGroup: Map<string, TabGroup>): void {
		const containers: WorkspaceTabs[] = [];
		this.collectTabContainers(this.app.workspace.rootSplit, containers);
		for (const container of containers) this.reorderContainer(container, fileToGroup);
	}

	private collectTabContainers(node: unknown, out: WorkspaceTabs[]): void {
		if (!node || typeof node !== "object") return;
		const n = node as Record<string, unknown>;
		if (Array.isArray(n["children"])) {
			const children = n["children"] as unknown[];
			if (!("direction" in n) && children.length > 0 &&
				typeof children[0] === "object" && children[0] !== null &&
				"view" in (children[0] as object)) {
				out.push(node as unknown as WorkspaceTabs);
				return;
			}
			for (const child of children) this.collectTabContainers(child, out);
		}
	}

	private reorderContainer(container: WorkspaceTabs, fileToGroup: Map<string, TabGroup>): void {
		const moveLeaf = (container as unknown as {moveLeaf?: (leaf: WorkspaceLeaf, index: number) => void}).moveLeaf;
		if (typeof moveLeaf !== "function") return;
		const children = (container as unknown as {children: WorkspaceLeaf[]}).children;
		if (!children || children.length < 2) return;

		const current = [...children];
		const processed = new Set<string>();

		for (let i = 0; i < current.length; i++) {
			const fp = this.getFilePath(current[i]!);
			if (!fp) continue;
			const group = fileToGroup.get(fp);
			if (!group || processed.has(group.id)) continue;

			const groupIndices: number[] = [];
			for (let j = 0; j < current.length; j++) {
				const jfp = this.getFilePath(current[j]!);
				if (jfp && fileToGroup.get(jfp)?.id === group.id) groupIndices.push(j);
			}

			if (groupIndices.length < 2) { processed.add(group.id); continue; }

			const sorted = [...groupIndices].sort((a, b) => a - b);
			let contiguous = true;
			for (let k = 1; k < sorted.length; k++) {
				if (sorted[k]! - sorted[k - 1]! > 1) { contiguous = false; break; }
			}

			if (!contiguous) {
				const insertAt = sorted[0]!;
				let offset = 0;
				for (const origIdx of sorted) {
					const leaf = current[origIdx]!;
					const targetIdx = insertAt + offset;
					if (origIdx !== targetIdx) {
						moveLeaf.call(container, leaf, targetIdx);
						current.splice(origIdx, 1);
						current.splice(targetIdx, 0, leaf);
					}
					offset++;
				}
			}
			processed.add(group.id);
		}
	}

	private refreshLabels(groups: TabGroup[]): void {
		document.querySelectorAll(`.${LABEL_CLASS}`).forEach(el => el.remove());
		if (groups.length === 0) return;

		const groupHeaders = new Map<string, HTMLElement[]>();
		for (const group of groups) groupHeaders.set(group.id, []);

		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			const headerEl = (leaf as unknown as {tabHeaderEl?: HTMLElement}).tabHeaderEl;
			if (!headerEl) return;
			const groupId = headerEl.dataset["tabGroup"];
			if (groupId && groupHeaders.has(groupId)) groupHeaders.get(groupId)!.push(headerEl);
		});

		for (const group of groups) {
			const headers = groupHeaders.get(group.id);
			if (!headers || headers.length === 0) continue;

			headers.sort((a, b) =>
				a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
			);

			const firstHeader = headers[0]!;
			const container = firstHeader.parentElement;
			if (!container) continue;

			const label = document.createElement("div");
			label.className = LABEL_CLASS;
			label.dataset["groupId"] = group.id;
			label.textContent = group.name;
			label.title = group.name;

			label.addEventListener("contextmenu", (evt: MouseEvent) => {
				evt.preventDefault();
				evt.stopPropagation();
				const menu = new Menu();
				menu.addItem(item => item.setTitle("Switch to group").setIcon("arrow-right-circle")
					.onClick(() => this.callbacks.onSwitch(group.id)));
				menu.addItem(item => item.setTitle("Open group tabs").setIcon("folder-open")
					.onClick(() => this.callbacks.onOpen(group.id)));
				menu.addItem(item => item.setTitle("Close group tabs").setIcon("x-circle")
					.onClick(() => this.callbacks.onClose(group.id)));
				menu.addSeparator();
				menu.addItem(item => item.setTitle("Delete group").setIcon("trash")
					.onClick(() => this.callbacks.onDelete(group.id)));
				menu.showAtMouseEvent(evt);
			});

			container.insertBefore(label, firstHeader);
		}
	}

	private rebuildStyles(groups: TabGroup[]): void {
		this.ensureStyleEl();
		if (!this.styleEl) return;
		const rules = groups.map(group => `
.workspace-tab-header[data-tab-group="${group.id}"] {
  box-shadow: inset 0 3px 0 0 ${group.color} !important;
}
.workspace-tab-header[data-tab-group="${group.id}"] .workspace-tab-header-inner-title {
  color: var(--tab-text-color, var(--text-normal));
}
.tab-group-label[data-group-id="${group.id}"] {
  background: ${group.color};
}
`).join("\n");
		this.styleEl.textContent = rules;
	}

	private getFilePath(leaf: WorkspaceLeaf): string | null {
		const fp = (leaf.getViewState().state as Record<string, unknown>)?.["file"];
		return typeof fp === "string" ? fp : null;
	}

	destroy(): void {
		document.removeEventListener("dragstart", this.onNativeDragStart, true);
		document.removeEventListener("dragend", this.onNativeDragEnd, true);
		this.styleEl?.remove();
		this.styleEl = null;
		document.querySelectorAll(`.${LABEL_CLASS}`).forEach(el => el.remove());
		this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
			const headerEl = (leaf as unknown as {tabHeaderEl?: HTMLElement}).tabHeaderEl;
			if (headerEl) delete headerEl.dataset["tabGroup"];
		});
	}

	private ensureStyleEl(): void {
		if (!this.styleEl) {
			this.styleEl = document.head.createEl("style", {attr: {id: "tab-groups-colors"}});
		}
	}
}

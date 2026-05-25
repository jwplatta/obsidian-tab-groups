import {App, FuzzySuggestModal, Modal, Setting} from "obsidian";
import {TabGroup} from "./types";

export class CreateGroupModal extends Modal {
	private onSubmit: (name: string) => void;
	private name = "";

	constructor(app: App, onSubmit: (name: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.createEl("h2", {text: "Create Tab Group"});

		new Setting(contentEl)
			.setName("Group name")
			.addText(text => {
				text.setPlaceholder("e.g. Work, Research...")
					.onChange(value => { this.name = value; });
				// Submit on Enter
				text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter") this.submit();
				});
				// Auto-focus
				setTimeout(() => text.inputEl.focus(), 50);
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText("Create")
				.setCta()
				.onClick(() => this.submit())
			);
	}

	private submit(): void {
		const name = this.name.trim();
		if (!name) return;
		this.close();
		this.onSubmit(name);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class SwitchGroupModal extends FuzzySuggestModal<TabGroup> {
	private groups: TabGroup[];
	private onChoose: (group: TabGroup) => void;

	constructor(app: App, groups: TabGroup[], onChoose: (group: TabGroup) => void) {
		super(app);
		this.groups = groups;
		this.onChoose = onChoose;
		this.setPlaceholder("Switch to tab group...");
	}

	getItems(): TabGroup[] {
		return this.groups;
	}

	getItemText(group: TabGroup): string {
		return `${group.name} (${group.leaves.length} tab${group.leaves.length !== 1 ? "s" : ""})`;
	}

	onChooseItem(group: TabGroup): void {
		this.onChoose(group);
	}
}

export class AddToGroupModal extends FuzzySuggestModal<TabGroup> {
	private groups: TabGroup[];
	private onChoose: (group: TabGroup) => void;

	constructor(app: App, groups: TabGroup[], onChoose: (group: TabGroup) => void) {
		super(app);
		this.groups = groups;
		this.onChoose = onChoose;
		this.setPlaceholder("Add current tab to group...");
	}

	getItems(): TabGroup[] {
		return this.groups;
	}

	getItemText(group: TabGroup): string {
		return group.name;
	}

	onChooseItem(group: TabGroup): void {
		this.onChoose(group);
	}
}

export class DeleteGroupModal extends FuzzySuggestModal<TabGroup> {
	private groups: TabGroup[];
	private onChoose: (group: TabGroup) => void;

	constructor(app: App, groups: TabGroup[], onChoose: (group: TabGroup) => void) {
		super(app);
		this.groups = groups;
		this.onChoose = onChoose;
		this.setPlaceholder("Delete tab group...");
	}

	getItems(): TabGroup[] {
		return this.groups;
	}

	getItemText(group: TabGroup): string {
		return group.name;
	}

	onChooseItem(group: TabGroup): void {
		this.onChoose(group);
	}
}

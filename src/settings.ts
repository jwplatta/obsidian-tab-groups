import {App, PluginSettingTab, Setting} from "obsidian";
import {TabGroupsPluginData} from "./types";
import type TabGroupsPlugin from "./main";

export interface TabGroupsSettings {
	data: TabGroupsPluginData;
}

export const DEFAULT_SETTINGS: TabGroupsSettings = {
	data: {
		groups: [],
		activeGroupId: null,
	},
};

export class TabGroupsSettingTab extends PluginSettingTab {
	plugin: TabGroupsPlugin;

	constructor(app: App, plugin: TabGroupsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl("h2", {text: "Tab Groups"});

		const groups = this.plugin.manager.getGroups();

		if (groups.length === 0) {
			containerEl.createEl("p", {
				text: "No tab groups yet. Create one via the command palette or right-clicking a tab.",
				cls: "setting-item-description",
			});
			return;
		}

		for (const group of groups) {
			const setting = new Setting(containerEl)
				.setName(group.name)
				.setDesc(`${group.leaves.length} tab${group.leaves.length !== 1 ? "s" : ""}`);

			// Color picker
			setting.addColorPicker(picker => picker
				.setValue(group.color)
				.onChange(async (color) => {
					this.plugin.manager.updateGroupColor(group.id, color);
					this.plugin.colorManager.refresh(this.plugin.manager.getGroups());
					await this.plugin.persistData();
					this.plugin.refreshSidebar();
				})
			);

			// Rename
			setting.addText(text => text
				.setPlaceholder("Rename group...")
				.setValue(group.name)
				.onChange(async (value) => {
					if (value.trim()) {
						this.plugin.manager.renameGroup(group.id, value.trim());
						await this.plugin.persistData();
						this.plugin.refreshSidebar();
					}
				})
			);

			// Delete
			setting.addButton(btn => btn
				.setButtonText("Delete")
				.setWarning()
				.onClick(async () => {
					this.plugin.manager.deleteGroup(group.id);
					this.plugin.colorManager.refresh(this.plugin.manager.getGroups());
					await this.plugin.persistData();
					this.plugin.refreshSidebar();
					this.display();
				})
			);
		}
	}
}

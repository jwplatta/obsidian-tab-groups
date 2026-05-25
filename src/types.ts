export interface TabGroupLeaf {
	filePath: string;
	viewType: string;
}

export interface TabGroup {
	id: string;
	name: string;
	color: string;
	leaves: TabGroupLeaf[];
	createdAt: number;
}

export interface TabGroupsPluginData {
	groups: TabGroup[];
	activeGroupId: string | null;
}

import React from "react";
import {TabGroup} from "../types";
import {TabGroupItem} from "./TabGroupItem";

interface Props {
	groups: TabGroup[];
	activeGroupId: string | null;
	onSwitch: (id: string) => void;
	onClose: (id: string) => void;
	onOpen: (id: string) => void;
	onDelete: (id: string) => void;
	onRename: (id: string, name: string) => void;
	onMoveUp: (id: string) => void;
	onMoveDown: (id: string) => void;
}

export function TabGroupList({groups, activeGroupId, onSwitch, onClose, onOpen, onDelete, onRename, onMoveUp, onMoveDown}: Props) {
	if (groups.length === 0) {
		return (
			<div className="tab-group-empty">
				No tab groups yet. Open some files and create a group.
			</div>
		);
	}

	return (
		<div className="tab-group-list">
			{groups.map((group, idx) => (
				<TabGroupItem
					key={group.id}
					group={group}
					isActive={group.id === activeGroupId}
					isFirst={idx === 0}
					isLast={idx === groups.length - 1}
					onSwitch={onSwitch}
					onClose={onClose}
					onOpen={onOpen}
					onDelete={onDelete}
					onRename={onRename}
					onMoveUp={onMoveUp}
					onMoveDown={onMoveDown}
				/>
			))}
		</div>
	);
}

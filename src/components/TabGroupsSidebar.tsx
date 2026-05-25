import React from "react";
import {TabGroup} from "../types";
import {CreateGroupForm} from "./CreateGroupForm";
import {TabGroupList} from "./TabGroupList";

interface Props {
	groups: TabGroup[];
	activeGroupId: string | null;
	onCreateGroup: (name: string) => void;
	onSwitchGroup: (id: string) => void;
	onCloseGroup: (id: string) => void;
	onOpenGroup: (id: string) => void;
	onDeleteGroup: (id: string) => void;
	onRenameGroup: (id: string, name: string) => void;
	onMoveGroupUp: (id: string) => void;
	onMoveGroupDown: (id: string) => void;
}

export function TabGroupsSidebar({groups, activeGroupId, onCreateGroup, onSwitchGroup, onCloseGroup, onOpenGroup, onDeleteGroup, onRenameGroup, onMoveGroupUp, onMoveGroupDown}: Props) {
	return (
		<div className="tab-groups-sidebar">
			<div className="tab-groups-sidebar__header">
				<span className="tab-groups-sidebar__title">Tab Groups</span>
				{groups.length > 0 && (
					<span className="tab-group-item__badge">{groups.length}</span>
				)}
			</div>
			<CreateGroupForm onCreateGroup={onCreateGroup} />
			<TabGroupList
				groups={groups}
				activeGroupId={activeGroupId}
				onSwitch={onSwitchGroup}
				onClose={onCloseGroup}
				onOpen={onOpenGroup}
				onDelete={onDeleteGroup}
				onRename={onRenameGroup}
				onMoveUp={onMoveGroupUp}
				onMoveDown={onMoveGroupDown}
			/>
		</div>
	);
}

import React, {useState} from "react";
import {TabGroup} from "../types";

interface Props {
	group: TabGroup;
	isActive: boolean;
	isFirst: boolean;
	isLast: boolean;
	onSwitch: (id: string) => void;
	onClose: (id: string) => void;
	onOpen: (id: string) => void;
	onDelete: (id: string) => void;
	onRename: (id: string, name: string) => void;
	onMoveUp: (id: string) => void;
	onMoveDown: (id: string) => void;
}

export function TabGroupItem({group, isActive, isFirst, isLast, onSwitch, onClose, onOpen, onDelete, onRename, onMoveUp, onMoveDown}: Props) {
	const [isRenaming, setIsRenaming] = useState(false);
	const [renameValue, setRenameValue] = useState(group.name);
	const [confirmDelete, setConfirmDelete] = useState(false);

	function submitRename() {
		const trimmed = renameValue.trim();
		if (trimmed && trimmed !== group.name) {
			onRename(group.id, trimmed);
		}
		setIsRenaming(false);
	}

	return (
		<div className={`tab-group-item${isActive ? " tab-group-item--active" : ""}`}>
			<span
				className="tab-group-item__color-dot"
				style={{backgroundColor: group.color}}
			/>
			<div className="tab-group-item__body">
				{isRenaming ? (
					<input
						className="tab-group-item__rename-input"
						value={renameValue}
						autoFocus
						onChange={e => setRenameValue(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter") submitRename();
							if (e.key === "Escape") setIsRenaming(false);
						}}
						onBlur={submitRename}
					/>
				) : (
					<span className="tab-group-item__name">{group.name}</span>
				)}
				<span className="tab-group-item__badge">
					{group.leaves.length} tab{group.leaves.length !== 1 ? "s" : ""}
				</span>
			</div>
			<div className="tab-group-item__actions">
				<button
					className="tab-group-item__btn clickable-icon"
					title="Move up"
					disabled={isFirst}
					onClick={() => onMoveUp(group.id)}
				>
					↑
				</button>
				<button
					className="tab-group-item__btn clickable-icon"
					title="Move down"
					disabled={isLast}
					onClick={() => onMoveDown(group.id)}
				>
					↓
				</button>
				<button
					className="tab-group-item__btn clickable-icon"
					title="Switch to group (replace all tabs)"
					onClick={() => onSwitch(group.id)}
				>
					⏎
				</button>
				<button
					className="tab-group-item__btn clickable-icon"
					title="Open group (add tabs)"
					onClick={() => onOpen(group.id)}
				>
					▶
				</button>
				<button
					className="tab-group-item__btn clickable-icon"
					title="Close group tabs"
					onClick={() => onClose(group.id)}
				>
					◼
				</button>
				<button
					className="tab-group-item__btn clickable-icon"
					title={isRenaming ? "Cancel rename" : "Rename"}
					onClick={() => {
						setRenameValue(group.name);
						setIsRenaming(r => !r);
					}}
				>
					✎
				</button>
				{confirmDelete ? (
					<>
						<button
							className="tab-group-item__btn tab-group-item__btn--danger clickable-icon"
							title="Confirm delete"
							onClick={() => { setConfirmDelete(false); onDelete(group.id); }}
						>
							✓
						</button>
						<button
							className="tab-group-item__btn clickable-icon"
							title="Cancel"
							onClick={() => setConfirmDelete(false)}
						>
							✕
						</button>
					</>
				) : (
					<button
						className="tab-group-item__btn clickable-icon"
						title="Delete group"
						onClick={() => setConfirmDelete(true)}
					>
						🗑
					</button>
				)}
			</div>
		</div>
	);
}

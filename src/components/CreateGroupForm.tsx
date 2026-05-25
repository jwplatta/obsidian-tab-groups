import React, {useState} from "react";

interface Props {
	onCreateGroup: (name: string) => void;
}

export function CreateGroupForm({onCreateGroup}: Props) {
	const [value, setValue] = useState("");

	function submit() {
		const name = value.trim();
		if (!name) return;
		onCreateGroup(name);
		setValue("");
	}

	return (
		<div className="tab-group-create-form">
			<input
				className="tab-group-create-form__input"
				type="text"
				placeholder="Group name..."
				value={value}
				onChange={e => setValue(e.target.value)}
				onKeyDown={e => { if (e.key === "Enter") submit(); }}
			/>
			<button
				className="tab-group-create-form__btn mod-cta"
				onClick={submit}
				disabled={!value.trim()}
			>
				Save Current Tabs
			</button>
		</div>
	);
}

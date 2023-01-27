// Paste into your browser's console with F12. A text area should pop up on the screen displaying progress for every lesson.
// To close it, click the textarea and press Escape
(() => {
	class LessonNode {
		constructor(props) {
			this.children = [];
			this.id = props.id;
			this.name = props.name;
			this.duration = props.duration ?? 0;
			this.watched = props.watched ?? 0;
			this.priority = props.priority ?? 0;
		}

		toString() {
			return this.name;
		}
	}

	/** @type Map<number, LessonNode> */
	const idMap = new Map();

	// lesson_map holds all the data
	const lessonMap = window.lesson_map;
	const rootID = lessonMap.master_department_id;
	const root = new LessonNode(rootID, "Root Directory");
	idMap.set(rootID, root);

	// Departments have content
	for (const dept of lessonMap.departments) {
		const childNode = new LessonNode({
			id: dept.id, 
			name: dept.name,
			priority: dept.displaySequence
		});
		idMap.set(dept.id, childNode);
		if (!idMap.has(dept.parentID))
			idMap.set(dept.parentID, new LessonNode({}));
		idMap.get(dept.parentID).children.push(childNode);
	}

	// media_groups are lessons
	for (const group of lessonMap.media_groups) {
		const childNode = new LessonNode({
			id: group.id, 
			name: group.name, 
			duration: group.duration, 
			watched: group.watched, 
			priority: group.sequences[0]
		});
		idMap.set(group.id, childNode);
		for (const deptId of group.departments) {
			if (idMap.has(deptId))
				idMap.get(deptId).children.push(childNode);
		}
	}

	for (const [key, value] of idMap) {
		value.children.sort((a, b) => a.priority - b.priority);
	}

	// Traverse and report:
	const report = [];
	function reportNode(node, currentPath=[]) {
		if (node.children.length === 0) {
			const actuallyDone = (node.duration - node.watched) === 1;
			const fractionDone = actuallyDone 
				? 1
				: node.watched / node.duration;
			report.push(`${currentPath.join(' > ')}: ${100 * fractionDone}%`);
		} else {
			for (const child of node.children) {
				reportNode(child, currentPath.concat(child.name));
			}
		}
	}
	reportNode(root);

	$('<div>').css(
		{
			position: 'absolute', top: 0, left: 0, 'background-color': 'white',
			'z-index': 99999
		})
		.append($('<textarea>').val(report.join('\n')))
		.appendTo(document.body)
		.on('keyup', e => {e.key === 'Escape' && $(e.target).remove()});
})();

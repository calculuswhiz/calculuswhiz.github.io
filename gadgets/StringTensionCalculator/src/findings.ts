import $ from 'jquery';
import Showdown from 'showdown';

import { MaterialRegressionEntry } from './tensions';

import './styles.scss';
import materialData from './materialQuadraticParams.json';

function valueToTableData(value: MaterialRegressionEntry) {
	const {a, b, c, rSq, description} = value;

	return [
		$('<td>').text(description),
		$('<td>').text(a.toPrecision(4)),
		$('<td>').text(b.toPrecision(4)),
		$('<td>').text(rSq)
	];
}

$(async () => {
	const converter = new Showdown.Converter(
	{
		tables: true,
		tablesHeaderId: true
	});
	converter.setFlavor('github');
	const markdown: string = await $.get('./src/findings.md');
	const html = converter.makeHtml(markdown);

	$('#root').html(html);

	const materialEntries = Object.values(materialData) as MaterialRegressionEntry[];
	materialEntries.sort((a, b) => b.a - a.a);

	for (const value of materialEntries)
	{
		$('#pre-table-1 + table tbody')
			.append(
				$('<tr>').append(valueToTableData(value))
			)
	}
});

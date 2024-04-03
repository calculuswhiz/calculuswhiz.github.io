import Showdown from 'showdown';

import './styles.scss';
import materialData from './materialQuadraticParams.json';
import findingsSource from './findings.md?raw';

function makeTd(content: string|number){
	const td = document.createElement('td');
	td.innerText = content.toString();
	return td;
}

function *valueToTableData(value: MaterialRegressionEntry) {
	const {a, b, rSq, description} = value;


	yield makeTd(description);
	yield makeTd(a.toPrecision(4));
	yield makeTd(b.toPrecision(4));
	yield makeTd(rSq);
}

const converter = new Showdown.Converter(
{
	tables: true,
	tablesHeaderId: true
});
converter.setFlavor('github');
const markdown: string = findingsSource;
const html = converter.makeHtml(markdown);

const root = document.querySelector('#root');
if (root == null)
	throw Error('No root!');
root.innerHTML = html;

const materialEntries = Object.values(materialData) as MaterialRegressionEntry[];
materialEntries.sort((a, b) => b.a - a.a);

const tBody = document.querySelector('#pre-table-1 + table tbody');
for (const value of materialEntries)
{
	const tr = document.createElement('tr');
	for (const data of valueToTableData(value))
	{
		tr.append(data);
	}
	tBody?.append(tr);
}
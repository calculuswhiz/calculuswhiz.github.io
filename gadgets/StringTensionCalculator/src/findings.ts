import $ from 'jquery';

import { MaterialRegressionEntry } from './tensions';

import './styles.scss';
import materialData from './materialQuadraticParams.json';

$(() => {
	function valueToTableData(value: MaterialRegressionEntry) {
		const {a, b, c, rSq, description} = value;

		return [
			$('<td>').text(description),
			$('<td>').text(`a = ${a.toExponential(3)}, b = ${b.toExponential(3)}, c = ${c.toExponential(3)}`),
			$('<td>').text(rSq)
		];
	}

	for (const value of Object.values(materialData) as MaterialRegressionEntry[])
	{
		$('#regressions tbody')
			.append(
				$('<tr>').append(valueToTableData(value))
			)
	}
});

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import $ from 'jquery';
import Showdown from 'showdown';
import './styles.scss';
import materialData from './materialQuadraticParams.json';
import findingsSource from './findings.md';
function valueToTableData(value) {
    const { a, b, rSq, description } = value;
    return [
        $('<td>').text(description),
        $('<td>').text(a.toPrecision(4)),
        $('<td>').text(b.toPrecision(4)),
        $('<td>').text(rSq)
    ];
}
$(() => __awaiter(void 0, void 0, void 0, function* () {
    const converter = new Showdown.Converter({
        tables: true,
        tablesHeaderId: true
    });
    converter.setFlavor('github');
    const markdown = yield $.get(findingsSource);
    const html = converter.makeHtml(markdown);
    $('#root').html(html);
    const materialEntries = Object.values(materialData);
    materialEntries.sort((a, b) => b.a - a.a);
    for (const value of materialEntries) {
        $('#pre-table-1 + table tbody')
            .append($('<tr>').append(valueToTableData(value)));
    }
}));

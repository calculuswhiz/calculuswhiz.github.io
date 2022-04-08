import * as Tensions from './tensions.js';
var counter = 0;
function addString(stat = null) {
    const $listArea = $('#tension-boxes');
    counter++;
    const newString = makeStringInput('string-input' + counter, stat);
    $listArea.append(newString);
    updateTension(newString);
}
;
const presets = {
    mandolin: [
        { pitch: 'E5', gauge: 11, material: 'Steel', scaleLength: 14 },
        { pitch: 'E5', gauge: 11, material: 'Steel', scaleLength: 14 },
        { pitch: 'A4', gauge: 16, material: 'Steel', scaleLength: 14 },
        { pitch: 'A4', gauge: 16, material: 'Steel', scaleLength: 14 },
        { pitch: 'D4', gauge: 22, material: 'PhosphorBronze', scaleLength: 14 },
        { pitch: 'D4', gauge: 22, material: 'PhosphorBronze', scaleLength: 14 },
        { pitch: 'G3', gauge: 35, material: 'PhosphorBronze', scaleLength: 14 },
        { pitch: 'G3', gauge: 35, material: 'PhosphorBronze', scaleLength: 14 },
    ]
};
function loadPreset(preset) {
    $('#tension-boxes').empty();
    const stats = presets[preset];
    for (const stat of stats) {
        addString(stat);
    }
    updateTotal();
}
function makeStringInput(id, stat) {
    var _a, _b, _c;
    const materials = ['Steel', 'FlatwoundSteel', 'PhosphorBronze'];
    const $el = $('<div>')
        .prop('id', id)
        .addClass('string-fields')
        .append($('<div>').addClass('input-fields').append($('<div>').addClass('pitch-field')
        .append($('<label>').text('Pitch'), $('<input>').prop({ type: 'text' }).val((_a = stat === null || stat === void 0 ? void 0 : stat.pitch) !== null && _a !== void 0 ? _a : '')), $('<div>').addClass('material-field').append($('<label>').text('Material'), $('<select>').append(materials.map(mtl => $('<option>')
        .prop({ value: mtl, selected: mtl === (stat === null || stat === void 0 ? void 0 : stat.material) })
        .text(mtl)))), $('<div>').addClass('gauge-field')
        .append($('<label>').text('Gauge'), $('<input>').prop({ type: 'text' }).val((_b = stat === null || stat === void 0 ? void 0 : stat.gauge) !== null && _b !== void 0 ? _b : '')), $('<div>').addClass('length-field')
        .append($('<label>').text('Scale Length'), $('<input>').prop({
        type: 'text',
        value: (_c = stat === null || stat === void 0 ? void 0 : stat.scaleLength) !== null && _c !== void 0 ? _c : $('input#default-scale').val()
    }))), $('<div>').addClass('tension-output-field').text('Tension')
        .append($('<input>').prop({ readonly: true })), $('<input>').prop({ type: 'button', value: 'Remove' }).click(_ => $el.remove()));
    $el.find('.input-fields').find('input,select').change(_ => {
        updateTension($el);
        updateTotal();
    });
    return $el;
}
function updateTension($el) {
    const id = $el.prop('id');
    const pitch = $(`#${id} .pitch-field input`).val();
    const material = $(`#${id} .material-field select`).val();
    const gauge = $(`#${id} .gauge-field input`).val();
    const length = $(`#${id} .length-field input`).val();
    console.log(pitch, material, gauge, length);
    const tension = Tensions.calcTension(pitch, material, gauge, length);
    const pressure = Tensions.calcPressure(gauge, tension);
    console.log(pressure);
    const shouldWarn = material === 'Steel'
        && pressure > Tensions.StainlessYieldStrength;
    $el.find('.tension-output-field input').val(tension);
    if (shouldWarn)
        $el.addClass('warning');
    else
        $el.removeClass('warning');
}
function updateTotal() {
    const total = [...$('.tension-output-field input')]
        .map(el => +$(el).val())
        .reduce((a, b) => a + b);
    $('#total-tension').text(total);
}
$(document).ready(() => {
    $('#add-string').click(_ => addString());
    $('#preset-menu').change(evt => loadPreset(evt.target.value));
});

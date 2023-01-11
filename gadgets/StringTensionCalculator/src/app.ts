import $ from 'jquery';

import * as Tensions from './tensions';

import materialData from './materialQuadraticParams.json';
import './styles.scss';

let counter = 0;

function addString(stat: StringStat = null) {
    const $listArea = $('#tension-boxes');
    counter++;
    const newString = makeStringInput('string-input' + counter, stat);
    $listArea.append(newString);
    updateTension(newString);
}

interface StringStat {
    pitch: string;
    material: Tensions.StringMaterial;
    gauge: number;
    scaleLength: number;
};

const presets = {
    mandolin: [
        { pitch: 'E5', gauge: 11, material: 'PL', scaleLength: 14 },
        { pitch: 'E5', gauge: 11, material: 'PL', scaleLength: 14 },
        { pitch: 'A4', gauge: 16, material: 'PL', scaleLength: 14 },
        { pitch: 'A4', gauge: 16, material: 'PL', scaleLength: 14 },
        { pitch: 'D4', gauge: 22, material: 'PB', scaleLength: 14 },
        { pitch: 'D4', gauge: 22, material: 'PB', scaleLength: 14 },
        { pitch: 'G3', gauge: 35, material: 'PB', scaleLength: 14 },
        { pitch: 'G3', gauge: 35, material: 'PB', scaleLength: 14 },
    ] as StringStat[]
};

function loadPreset(preset: string) {
    $('#tension-boxes').empty();
    const stats = presets[preset] as StringStat[] ?? [];
    for (const stat of stats) {
        addString(stat);
    }
    updateTotal();
}

function makeStringInput(id: string, stat: StringStat) {
    const materials: {[key: string]: Tensions.MaterialRegressionEntry} = materialData;
    const materialKeys = Object.keys(materials);
    const $el = $('<div>')
        .prop('id', id)
        .addClass('string-fields')
        .append(
            $('<div>').addClass('input-fields').append(
                $('<div>').addClass('pitch-field')
                    .append(
                        $('<label>').text('Pitch'),
                        $('<input>').prop({ type: 'text' }).val(stat?.pitch ?? '')
                    ),
                $('<div>').addClass('material-field').append(
                    $('<label>')
                        .prop('title',
                            Object.entries(materials).map(mtl =>
                                `${mtl[0]}: ${mtl[1].description}`
                            ).join('\n')
                        )
                        .text('Material'),
                    $('<select>').append(
                        materialKeys.map(mtl =>
                            $('<option>')
                                .prop({ value: mtl, selected: mtl === stat?.material })
                                .text(mtl)
                        )
                    )
                ),
                $('<div>').addClass('gauge-field')
                    .append(
                        $('<label>').text('Gauge'),
                        $('<input>').prop({ type: 'text' }).val(stat?.gauge ?? '')
                    ),
                $('<div>').addClass('length-field')
                    .append(
                        $('<label>').text('Scale Length'),
                        $('<input>').prop({
                            type: 'text',
                            value: stat?.scaleLength ?? $('input#default-scale').val()
                        })
                    )
            ),
            $('<div>').addClass('tension-output-field').text('Tension')
                .append($('<input>').prop({ readonly: true })),
            $('<input>').prop({type: 'button', value: 'Remove'}).click(_ => $el.remove())
    );

    $el.find('.input-fields').find('input,select').change(_ => {
        updateTension($el);
        updateTotal();
    });

    return $el;
}

function updateTension($el: JQuery) {
    const id = $el.prop('id');
    const pitch = $(`#${id} .pitch-field input`).val() as string;
    const material = $(`#${id} .material-field select`).val() as Tensions.StringMaterial;
    const gauge = $(`#${id} .gauge-field input`).val() as number;
    const length = $(`#${id} .length-field input`).val() as number;

    console.log(pitch, material, gauge, length);

    const tension = Tensions.calcTension(pitch, material, gauge, length);
    const pressure = Tensions.calcPressure(gauge, tension);
    console.log(pressure);
    const shouldWarn = material === 'PL'
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
    $('#preset-menu').change(evt => loadPreset((evt.target as HTMLSelectElement).value));
});
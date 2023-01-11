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
        { pitch: 'E5', gauge: 11, material: 'PL', scaleLength: 13.75 },
        { pitch: 'E5', gauge: 11, material: 'PL', scaleLength: 13.75 },
        { pitch: 'A4', gauge: 16, material: 'PL', scaleLength: 13.75 },
        { pitch: 'A4', gauge: 16, material: 'PL', scaleLength: 13.75 },
        { pitch: 'D4', gauge: 22, material: 'PB', scaleLength: 13.75 },
        { pitch: 'D4', gauge: 22, material: 'PB', scaleLength: 13.75 },
        { pitch: 'G3', gauge: 35, material: 'PB', scaleLength: 13.75 },
        { pitch: 'G3', gauge: 35, material: 'PB', scaleLength: 13.75 },
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

function makePitchField(pitch: string) {
    return $('<div>').addClass('pitch-field')
        .append(
            $('<label>').text('Pitch (E.g. C3)'),
            $('<input>').prop({ type: 'text' }).val(pitch ?? '')
        );
}

function makeMaterialField(material: string) {
    const materials: {[key: string]: Tensions.MaterialRegressionEntry} = materialData;
    const materialEntries = Object.entries(materials);
    // const materialKeys = Object.keys(materials);
    return $('<div>').addClass('material-field').append(
        $('<label>').text('Material'),
        $('<select>').append(
            materialEntries.map(mtl =>
                $('<option>')
                    .prop({ value: mtl[0], selected: mtl[0] === material })
                    .text(`${mtl[0]}: ${mtl[1].description}`)
            )
        )
    );
}

function makeGaugeField(gauge: number) {
    return $('<div>').addClass('gauge-field')
        .append(
            $('<label>').text('Gauge (E.g. 050)'),
            $('<input>').prop({ type: 'text' }).val(gauge ?? '')
        );
}

function makeLengthField(scaleLength: number) {
    return $('<div>').addClass('length-field')
        .append(
            $('<label>').text('Scale Length (in.)'),
            $('<input>').prop({
                type: 'text',
                value: scaleLength ?? $('input#default-scale').val()
            })
        );
}

function makeStringInput(id: string, stat: StringStat) {
    const $el = $('<div>')
        .prop('id', id)
        .addClass('string-fields')
        .append(
            $('<div>').addClass('input-fields').append(
                makePitchField(stat?.pitch),
                makeMaterialField(stat?.material),
                makeGaugeField(stat?.gauge),
                makeLengthField(stat?.scaleLength)
            ),
            $('<div>').addClass('tension-output-field').text('Tension')
                .append($('<input>').prop({ readonly: true })),
            $('<input>')
                .prop({type: 'button', value: 'Remove'})
                .on('click', _ => {
                    $el.remove();
                    updateTotal();
                })
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
    const gauge = +$(`#${id} .gauge-field input`).val();
    const lengthFromField = +$(`#${id} .length-field input`).val();

    const length = (lengthFromField > 0) ? lengthFromField : +$('#default-scale').val();

    console.log(pitch, material, gauge, lengthFromField);

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

$(() => {
    $<HTMLSelectElement>('#preset-menu').val('');
    $('#add-string').on('click', _ => addString());
    $('#preset-menu').on('change', evt => loadPreset((evt.target as HTMLSelectElement).value));
});

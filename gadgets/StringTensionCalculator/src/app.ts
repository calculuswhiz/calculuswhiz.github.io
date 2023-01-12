import $ from 'jquery';

import * as Tensions from './tensions';

import frequencyData from './frequencyBases.json';
import materialData from './materialQuadraticParams.json';
import presets from './presets.json';
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
    courseCount: number;
};

function loadPreset(preset: string) {
    $('#tension-boxes').empty();
    const stats = presets[preset] as StringStat[] ?? [];
    for (const stat of stats)
        addString(stat);

    updateTotal();
}

function closePitchDialog(){
    $('#pitch-dialog').remove();
    $('#app-root').css('opacity', '');
}

function openPitchDialog($requestingElement: JQuery) {
    $('#app-root').css('opacity', '50%');
    const pitches = Object.keys(frequencyData);

    let confirmedPitch: string = null;
    let confirmedOctave: number = null;

    function completeDialog() {
        $requestingElement.find('input').val(confirmedPitch + confirmedOctave)
            .trigger('change');
        closePitchDialog();
    }

    const requestingPos = $requestingElement.position();

    $('<div>').prop('id', 'pitch-dialog')
        .css({
            left: requestingPos.left + $requestingElement.width(),
            top: requestingPos.top
        })
        .append(
            $('<div>').prop('id', 'note-buttons')
                .append(
                    $('<div>').text('Select Note'),
                    pitches.map(pitch =>
                        $('<input>')
                            .prop('type', 'button')
                            .addClass(`note-button`)
                            .val(pitch)
                            .on('click', evt =>
                            {
                                const $target = $(evt.target);
                                const selectedClass = 'selected-note';
                                $(`.${selectedClass}`).removeClass(selectedClass);
                                $target.addClass(selectedClass);

                                confirmedPitch = $target.val() as string;
                                if (confirmedPitch != null && confirmedOctave != null)
                                    completeDialog();
                            })
                    )
                ),
            $('<div>').prop('id', 'octave-buttons')
                .append(
                    $('<div>').text('Select Octave'),
                    new Array(8).fill(0).map((_, i) =>
                        $('<input>')
                            .prop('type', 'button')
                            .addClass('octave-button')
                            .val(i)
                            .on('click', evt =>
                            {
                                const $target = $(evt.target);
                                const selectedClass = 'selected-octave';
                                $(`.${selectedClass}`).removeClass(selectedClass);
                                $target.addClass(selectedClass);

                                confirmedOctave = +$target.val();
                                if (confirmedPitch != null && confirmedOctave != null)
                                    completeDialog();
                            })
                    )
                )
        ).appendTo(document.body);
}

function makePitchField(pitch: string) {
    const $component = $('<div>').addClass('pitch-field')
        .append(
            $('<label>').text('Pitch (E.g. C3)'),
            $('<input>').prop({ type: 'text' }).val(pitch ?? '')
                .on('click', () => {
                    if ($('#pitch-dialog').length === 0)
                        openPitchDialog($component);
                    else {
                        closePitchDialog();
                    }
                })
        );

    return $component;
}

function makeMaterialField(material: string) {
    const materials: {[key: string]: MaterialRegressionEntry} = materialData;
    const materialEntries = Object.entries(materials);

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

function makeCourseField(courses: number) {
    return $('<div>').addClass('course-field')
        .append(
            $('<label>').text('Course multiplier'),
            $('<input>').prop({
                type: 'number',
                value: courses ?? 1,
                min: 1
            })
        );
}

const audioCtx: AudioContext
    = new (AudioContext ?? (window as any).webkitAudioContext)();
const oscillator = audioCtx.createOscillator();
oscillator.connect(audioCtx.destination);
let oscillatorIsGoing = false;
let contextIsRunning = false;

function makeButtons(id: string) {
    return $('<div>').addClass('string-buttons').append(
        $('<input>')
            .prop({type: 'button', value: 'Remove'})
            .on('click', _ => {
                $('#' + id).remove();
                updateTotal();
            }),
        $('<input>')
            .prop({type: 'button', value: 'Play/Stop'})
            .on('click', _ => {
                if (!oscillatorIsGoing)
                {
                    oscillator.start();
                    oscillatorIsGoing = true;
                }

                if (contextIsRunning)
                    audioCtx.suspend();
                else
                    audioCtx.resume();
                contextIsRunning = !contextIsRunning;

                const pitch = $('#' + id).find('.pitch-field input').val() as string;
                const freq = Tensions.pitchToFreq(pitch);
                oscillator.frequency.setValueAtTime(freq, 0);
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
                makeLengthField(stat?.scaleLength),
                makeCourseField(stat?.courseCount)
            ),
            $('<div>').addClass('tension-output-field').text('Tension')
                .append($('<input>').prop({ readonly: true })),
           makeButtons(id)
    );

    $el.find('.input-fields').find('input,select').on('change', _ => {
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

    const courseMultiplier = +$(`#${id} .course-field input`).val();

    const tension = Tensions.calcTension(pitch, material, gauge, length) * courseMultiplier;
    const pressure = Tensions.calcPressure(gauge, tension);

    const shouldWarn = material === 'PL'
        && pressure > Tensions.StainlessYieldStrength * courseMultiplier;

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
    for (const [instrument, preset] of Object.entries(presets)) {
        $('#preset-menu').append(
            $('<option>').val(instrument).text(instrument)
        )
    }
    $('#preset-menu').on('change', evt => loadPreset((evt.target as HTMLSelectElement).value));
});

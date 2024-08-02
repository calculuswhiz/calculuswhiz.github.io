import * as Tensions from './tensions';
import frequencyData from './frequencyBases.json';
import { useEffect, useState } from 'react';
import materialData from './materialQuadraticParams.json';
import presets from './presets.json';

/**
 * Holds parameters of a string's data
 *  */
interface CourseStat {
    /** Used to generate keys */
    uniqueId: string;
    /** Pitch in pitch-octave notation */
    pitch: string;
    /** The material of the string */
    material: Tensions.StringMaterial;
    /** Gauge = 1000ths of an inch */
    gauge: number;
    /** Scale length of the string */
    scaleLength: number;
    /** # strings per course */
    courseCount: number;
}

/** Unit of measure used by app */
enum Unit { US='US', Metric='Metric' }
/** Look up unit names by type and system */
const unitNameLookup = {
  shortLength: { US: 'in', Metric: 'cm' } as {[system in Unit]: Tensions.AcceptableUnits},
  weight: { US: 'lb', Metric: 'kg'} as {[system in Unit]: string}
};

// Set up audio context to allow pitch preview
const audioCtx: AudioContext
    = new (AudioContext ?? (window as any).webkitAudioContext)();
const gainNode = new GainNode(audioCtx, {gain: 0.05});
gainNode.connect(audioCtx.destination);
const oscillator = new OscillatorNode(audioCtx);
oscillator.connect(gainNode);
let oscillatorIsGoing = false;
let contextIsRunning = false;

function getDefaultScaleLength() {
  return +(document.querySelector('input#default-scale') as HTMLInputElement).value;
}

export function AppInfo() {
  const [showingDetails, setShowingDetails] = useState(false);

  const materials: {[key: string]: MaterialRegressionEntry} = materialData;

  return <div id="app-info-container">
    <h1>String Tension Calculator</h1>
    <p>
      Current Values based on <a href="https://www.daddario.com/globalassets/pdfs/accessories/tension_chart_13934.pdf">D&apos;Addario pdf</a> data.
      For an analysis of D&apos;Addario strings, please see <a href="./findings.html">this article</a>.<br />
      However, I plan of phasing out the simple regression curves in order to support a broad range
      of strings and manufacturers.<br />
      (Looking at their <a href="https://www.ghsstrings.com/u/uvh28">data</a>, GHS strings don&apos;t behave quite as nicely.)
    </p>
    <div id="detail-view">
      <h2>Details</h2>
      <input type='button' value={`Click to ${showingDetails ? 'hide' : 'show'}`}
        onClick={() => setShowingDetails(!showingDetails)} />
      {
        showingDetails
          ? <ul>
            <li>Assumes A4=440, equal temperament</li>
            <li>
              Currently supported strings are
              <ul>{
                Object.values(materials).map(m =>
                  <li key={m.description}>{m.description}</li>
                )
              }</ul>
              These are based on D&apos;Addario&apos;s data. Different companies may wind their strings
              differently, but the unwound strings should not deviate by any significant amount.
            </li>
          </ul>
          : ''
      }
    </div>
  </div>;
}

export function PresetFunctionButtons(props:
{
  addCourse: (stat: CourseStat) => void,
  dumpData: () => void,
  loadData: () => void,
  copyData: () => void
}) {
  return <div id="preset-functions">
    <input
      type="button"
      id="add-string"
      value="Add String"
      onClick={() => props.addCourse({
        uniqueId: crypto.randomUUID(),
        courseCount: 1,
        gauge: 0,
        material: 'PL',
        pitch: '',
        scaleLength: getDefaultScaleLength()
      })} />
    <input
      type="button"
      id="dump-config"
      value="Dump Data"
      title="Dumps data to textbox so it can be loaded later"
      onClick={() => props.dumpData() } />
    <input
      type="button"
      id="copy-config"
      value="Copy Data"
      title="Copy data to be saved later"
      onClick={() => props.copyData()} />
    <input
      type="button"
      id="load-config"
      value="Load Data"
      title="Load saved data from textbox"
      onClick={() => props.loadData() } />
  </div>;
}

export function PitchDialog(
  { confirmPitchInput, currentValue }: {
    confirmPitchInput: (note: string, octave: number) => void;
    /** Currently selected note */
    currentValue: {note: string, octave: number|null};
  }
) {
    const pitches = Object.keys(frequencyData);

    const [confirmedNote, setConfirmedNote] = useState<string|null>(null);
    const [confirmedOctave, setConfirmedOctave] = useState<number|null>(null);

    useEffect(() => {
      if (confirmedNote !== null && confirmedOctave !== null)
        confirmPitchInput(confirmedNote, confirmedOctave);
    }, [confirmedNote, confirmedOctave, confirmPitchInput]);

  return <div id="pitch-dialog">
    <div id="note-buttons">
      <div>Select Note</div>
      {
        pitches.map(pitch => {
          const confirmModifier = pitch === confirmedNote
            ? 'selected-note'
            : '';

          const currentValueModifier = pitch === currentValue.note
            ? 'is-current' : '';

          return <input
              key={pitch}
              type="button"
              className={`note-button ${confirmModifier} ${currentValueModifier}`}
              value={pitch}
              onClick={evt => setConfirmedNote(evt.currentTarget.value)} />;
        })
      }
    </div>
    <div id="octave-buttons">
      <div>Select Octave</div>
      {
        new Array(8).fill(0).map((_, i) => {
          const confirmModifier = i === confirmedOctave
            ? 'selected-octave'
            : '';

          const currentValueModifier = i === currentValue.octave
            ? 'is-current' : '';

          return <input
              key={i}
              type="button"
              className={`octave-button ${confirmModifier} ${currentValueModifier}`}
              value={i}
              onClick={evt => setConfirmedOctave(+evt.currentTarget.value)} />;
        })
      }
    </div>
    <div id="other-buttons">
      <input
        type='button'
        value='Cancel'
        onClick={() => {
          setConfirmedNote(currentValue.note);
          setConfirmedOctave(currentValue.octave);
        }} />
    </div>
  </div>;
}

interface ITensionBoxProps {
  id: number;
  stat: CourseStat;
  measuringSystem: Unit;
  tension: number;
  update: <T extends keyof CourseStat>(index: number, field: T, value: CourseStat[T]) => void;
  deleteCourse: (index: number) => void;
}

export function TensionBox(
  {id, stat, measuringSystem, tension, update, deleteCourse }: ITensionBoxProps
) {

  const [showingPitchDialog, setShowingPitchDialog] = useState(false);

  function confirmPitchInput(note: string, octave: number) {
    update(id, 'pitch', `${note}${octave}`);
    setShowingPitchDialog(false);
  }

  const materials: {[key: string]: MaterialRegressionEntry} = materialData;
  const materialEntries = Object.entries(materials);

  return <div id={`course-input${id}`} className='course-fields'>
    <div className="input-fields">
      <div className="pitch-field">
        <label>Pitch (E.g. C3)</label>
        <input
          type="text"
          value={stat.pitch}
          readOnly
          // onChange={ e => update(id, 'pitch', e.target.value.trim()) }
          onClick={ () => setShowingPitchDialog(true) } />
        {
          showingPitchDialog
          ? <PitchDialog
            confirmPitchInput={confirmPitchInput}
            currentValue={{
              note: stat.pitch.slice(0, -1),
              octave: stat.pitch.slice(-1).length > 0
                ? +stat.pitch.slice(-1)
                : null
            }} />
          : null
        }
      </div>
      <div className="material-field">
        <label>Material</label>
        <select
          value={stat.material}
          onChange={e =>
            update(id, 'material', e.target.value as Tensions.StringMaterial)
          }
        >{
          materialEntries.map(([key, regression]) =>
            <option key={key} value={key}>
              {key}: {regression.description}
            </option>
          )
        }</select>
      </div>
      <div className="gauge-field">
        <label>Gauge (E.g. 050)</label>
        <input
          type='text'
          value={stat.gauge}
          onChange={e => update(id, 'gauge', +e.target.value) } />
      </div>
      <div className="length-field">
        <label>
          Scale Length ({unitNameLookup.shortLength[measuringSystem]})
        </label>
        <input
          type="text"
          value={stat.scaleLength}
          onChange={e => update(id, 'scaleLength', +e.target.value) } />
      </div>
      <div className="course-field">
        <label>Course multiplier</label>
        <input
          type="text"
          value={stat.courseCount}
          min={1}
          onChange={e => update(id, 'courseCount', +e.target.value)} />
      </div>
    </div>
    <div className="tension-output-field">
      Tension ({unitNameLookup.weight[measuringSystem]})
      <input readOnly value={tension.toFixed(3)} />
    </div>
    <div className="course-buttons">
      <input
        type="button"
        value="Remove"
        onClick={() => {
          if (contextIsRunning)
              audioCtx.suspend();
          contextIsRunning = false;

          deleteCourse(id);
        }} />
      <input
        type="button"
        value="Play/Stop"
        onClick={() => {
          if (!oscillatorIsGoing) {
              oscillator.start();
              oscillatorIsGoing = true;
          }

          if (contextIsRunning)
              audioCtx.suspend();
          else
              audioCtx.resume();
          contextIsRunning = !contextIsRunning;

          const freq = Tensions.pitchToFreq(stat.pitch);
          if (freq != null)
            oscillator.frequency.setValueAtTime(freq, 0);
        }} />
    </div>
  </div>;
}

export function AppRoot() {
  const [defaultLen, setDefaultLen] = useState(25);

  const [totalTension, setTotalTension] = useState(0);
  const [tensionBoxProps, setTensionBoxProps] = useState(new Array<CourseStat>);

  const [measuringSystem, setMeasuringSystem] = useState(Unit.US);

  const [showingCopyNotice, setShowingCopyNotice] = useState(false);

  function addCourse(stat: CourseStat) {
    setTensionBoxProps(tensionBoxProps.concat(stat));
  }

  function deleteCourse(index: number) {
    setTensionBoxProps([
      ...tensionBoxProps.slice(0, index),
      ...tensionBoxProps.slice(index + 1)
    ]);
  }

  /**
   * Set new field value
   * */
  function setFieldAt<T extends keyof CourseStat>(index: number, field: T, value: CourseStat[T]) {
    tensionBoxProps[index][field] = value;
    setTensionBoxProps([...tensionBoxProps]);
  }

  function dumpData() {
    const dumpArea = document.getElementById('dump-area') as HTMLTextAreaElement;
    dumpArea.value = JSON.stringify(tensionBoxProps);
  }

  function loadData() {
    try {
      const dumpArea = document.getElementById('dump-area') as HTMLTextAreaElement;
      setTensionBoxProps(JSON.parse(dumpArea.value));
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const total = tensionBoxProps.reduce((prev, cur) => prev + Tensions.calcTension(
        cur.pitch, cur.material, cur.gauge,
        cur.scaleLength, unitNameLookup.shortLength[measuringSystem]
      ) * cur.courseCount, 0);
    setTotalTension(total);
  }, [tensionBoxProps, measuringSystem]);

  function loadPreset(preset: string) {
    const stats = presets[preset as keyof typeof presets] as CourseStat[] ?? [];
    setTensionBoxProps(stats);
  }

  async function copyData() {
    const dumpArea = document.getElementById('dump-area') as HTMLTextAreaElement;
    await navigator.clipboard.writeText(dumpArea.value);
    setShowingCopyNotice(true);
    setTimeout(() => { setShowingCopyNotice(false); }, 3000);
  }

  return <div id="app-root-container">
    <div>
      <label>
        Default scale length ({unitNameLookup.weight[measuringSystem]}) used when adding new string
      </label>
      <input
        type="text"
        id="default-scale"
        step="0.01"
        value={defaultLen}
        onChange={e => setDefaultLen(+e.target.value)} />
    </div>
    <div>
      <label>Go metric</label>
      <input type="checkbox"
        onChange={e =>
          setMeasuringSystem(e.target.checked ? Unit.Metric : Unit.US)
        } />
    </div>
    {showingCopyNotice ? <div id="copy-notice">Copied</div> : null}
    <PresetFunctionButtons
      addCourse={addCourse}
      dumpData={dumpData}
      loadData={loadData}
      copyData={copyData} />
    <p>SaveData:</p>
    <textarea id="dump-area"></textarea>
    <hr />
    <div>
      Total Tension:
      <span id="total-tension">
        {totalTension > 0 ? totalTension.toFixed(2) : '...'}
        &nbsp;
        {unitNameLookup.weight[measuringSystem]}
      </span>
    </div>
    Presets:
    <select
      id="preset-menu"
      defaultValue={''}
      onChange={e => loadPreset(e.target.value)} >
      <option value="">Make a selection</option>
      {
        Object.keys(presets)
          .map(inst =>
            <option key={inst} value={inst}>
              {inst}
            </option>
          )
      }
    </select>
    <div id="tension-boxes">
    {
      tensionBoxProps.map((stat, i) =>
        <TensionBox
          key={stat.uniqueId}
          id={i}
          stat={stat}
          tension={
            Tensions.calcTension(
              stat.pitch, stat.material, stat.gauge,
              stat.scaleLength, unitNameLookup.shortLength[measuringSystem]
            ) * stat.courseCount
          }
          measuringSystem={measuringSystem}
          update={setFieldAt}
          deleteCourse={deleteCourse} />
      )
    }
    </div>
  </div>;
}
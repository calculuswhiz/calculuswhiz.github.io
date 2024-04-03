import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";

import * as Tensions from './tensions';

import frequencyData from './frequencyBases.json';
import materialData from './materialQuadraticParams.json';
import presets from './presets.json';
import './styles.scss';

/**
 * Holds parameters of a string's data
 *  */
interface CourseStat {
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
const unitNameLookup =
{
  shortLength: { US: 'in', Metric: 'cm' } as {[system in Unit]: Tensions.AcceptableUnits},
  weight: { US: 'lb', Metric: 'kg'} as {[system in Unit]: string}
};

// Set up audio context to allow pitch preview
const audioCtx: AudioContext
    = new (AudioContext ?? (window as any).webkitAudioContext)();
const oscillator = audioCtx.createOscillator();
oscillator.connect(audioCtx.destination);
let oscillatorIsGoing = false;
let contextIsRunning = false;

function AppInfo()
{
  return <div id="app-info-container">
    <h1>String Tension Calculator</h1>
    <p>
      Values based on <a href="https://www.daddario.com/globalassets/pdfs/accessories/tension_chart_13934.pdf">D&apos;Addario pdf</a> data.
      For more details on how this works, please see <a href="./findings.html">this article</a>.
    </p>
    <p>
      Assumptions: A4=440, equal temperament
    </p>
  </div>;
}

function PresetFunctions(props:
{
  addCourse: (stat: CourseStat | null) => void,
  dumpData: () => void,
  loadData: () => void
})
{
  return <div id="preset-functions">
    <input
      type="button"
      id="add-string"
      value="Add String"
      onClick={() => props.addCourse(null)}
    />
    <input
      type="button"
      id="dump-config"
      value="Dump Data"
      title="Dumps data to textbox so it can be loaded later"
      onClick={() => { props.dumpData() }}
    />
    <input
      type="button"
      id="load-config"
      value="Load Data"
      title="Load saved data from textbox"
      onClick={() => { props.loadData() }}
    />
  </div>;
}

function PitchDialog(
  props:
  {
    confirmPitchInput: (note: string, octave: number) => void;
  }
) {
    const pitches = Object.keys(frequencyData);

    const [confirmedNote, setConfirmedNote] = useState<string|null>(null);
    const [confirmedOctave, setConfirmedOctave] = useState<number|null>(null);

    useEffect(() =>
    {
      if (confirmedNote !== null && confirmedOctave !== null)
      props.confirmPitchInput(confirmedNote, confirmedOctave);
    }, [confirmedNote, confirmedOctave]);

  return <div id="pitch-dialog">
    <div id="note-buttons">
      <div>Select Note</div>
      {
        pitches.map(pitch =>
        {
          const confirmModifier = pitch === confirmedNote
            ? ' selected-note'
            : '';

          return (
            <input
              key={pitch}
              type="button"
              className={'note-button' + confirmModifier}
              value={pitch}
              onClick={evt => {setConfirmedNote(evt.currentTarget.value);}}
            />);
        })
      }
    </div>
    <div id="octave-buttons">
      <div>Select Octave</div>
      {
        new Array(8).fill(0).map((_, i) =>
        {
          const confirmModifier = i === confirmedOctave
            ? ' selected-octave'
            : '';

          return(
            <input
              key={i}
              type="button"
              className={'octave-button' + confirmModifier}
              value={i}
              onClick={evt => {setConfirmedOctave(+evt.currentTarget.value);}}
            />);
        })
      }
    </div>
  </div>;
}

function TensionBox(
  props:
  {
    id: number;
    initStat: CourseStat|null;
    measuringSystem: Unit
    update: (index: number, value: number|null) => void;
  }
)
{
  const [pitch, setPitch] = useState(props.initStat?.pitch ?? '');
  const [material, setMaterial]
    = useState<Tensions.StringMaterial>(props.initStat?.material ?? 'PL');
    const [gauge, setGauge] = useState(props.initStat?.gauge ?? 0);
    const [scaleLength, setScaleLength] = useState(
      props.initStat?.scaleLength
      ?? +(document.querySelector('input#default-scale') as HTMLInputElement)
        .value
  );
  const [courseMultiplier, setCourseMultiplier]
    = useState(props.initStat?.courseCount ?? 1);

  const [showingPitchDialog, setShowingPitchDialog] = useState(false);

  function getTension()
  {
    return Tensions.calcTension(
      pitch, material, gauge, scaleLength,
      unitNameLookup.shortLength[props.measuringSystem]
    ) * courseMultiplier;
  }

  function confirmPitchInput(note: string, octave: number) {
    setPitch(note + octave);
    setShowingPitchDialog(false);
  }

  useEffect(
    () => {
      const newTension = getTension();
      props.update(props.id, newTension);
    },
    [pitch, material, gauge, scaleLength, courseMultiplier, props.measuringSystem]
  );

  const materials: {[key: string]: MaterialRegressionEntry} = materialData;
    const materialEntries = Object.entries(materials);

  return <div id={'course-input' + props.id} className='course-fields'>
    <div className="input-fields">
      <div className="pitch-field">
        <label>Pitch (E.g. C3)</label>
        <input
          type="text"
          value={pitch}
          onChange={e => { setPitch(e.target.value.trim()); }}
          onClick={() => { setShowingPitchDialog(true); }}
        />
        { showingPitchDialog ? <PitchDialog confirmPitchInput={confirmPitchInput} /> : null }
      </div>
      <div className="material-field">
        <label>Material</label>
        <select value={material} onChange={e => {
          setMaterial(e.target.value as Tensions.StringMaterial);
        }}>
        {
          materialEntries.map(mtl =>
            <option key={mtl[0]} value={mtl[0]}>
              {mtl[0]}: {mtl[1].description}
            </option>
                )
        }
        </select>
      </div>
      <div className="gauge-field">
        <label>Gauge (E.g. 050)</label>
        <input type='text' value={gauge} onChange={e => {
          setGauge(+e.target.value);
        }} />
      </div>
      <div className="length-field">
        <label>
          Scale Length ({unitNameLookup.shortLength[props.measuringSystem]})
        </label>
        <input type="text" value={scaleLength} onChange={e => {
          setScaleLength(+e.target.value);
        }} />
      </div>
      <div className="course-field">
        <label>Course multiplier</label>
        <input type="text" value={courseMultiplier} min={1} onChange={e => {
          setCourseMultiplier(+e.target.value);
        }} />
      </div>
    </div>
    <div className="tension-output-field">
      Tension ({unitNameLookup.weight[props.measuringSystem]})
      <input readOnly value={getTension().toFixed(3)} />
    </div>
    <div className="course-buttons">
      <input type="button" value="Remove" onClick={() => {
        if (contextIsRunning)
                    audioCtx.suspend();
                contextIsRunning = false;

                props.update(props.id, null);
      }}/>
      <input type="button" value="Play/Stop" onClick={() => {
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

                const freq = Tensions.pitchToFreq(pitch);
                if (freq != null)
                  oscillator.frequency.setValueAtTime(freq, 0);
      }} />
    </div>
  </div>;
}

function AppRoot()
{
  const [defaultLen, setDefaultLen] = useState(25);

  const [tensions, setTensions] = useState(new Array<number>);
  const [totalTension, setTotalTension] = useState(0);
  const [tensionBoxProps, setTensionBoxProps]
    = useState(new Array<CourseStat|null>);

  const [measuringSystem, setMeasuringSystem] = useState(Unit.US);

  function addCourse(stat: CourseStat | null) {
    setTensionBoxProps(tensionBoxProps.concat(stat));
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

  useEffect(() =>
  {
    setTotalTension(
      tensions.reduce((a, b) => a + b, 0)
    );
  }, [tensions, measuringSystem]);

  /**
   * @param value New tension value. If null - delete
   * */
  function setTensionAt(index: number, value: number|null) {
    setTensions(oldTensions =>
    {
      const newTensions = [...oldTensions];
      if (value !== null) {
        newTensions[index] = value;
        return newTensions;
      }
      else {
        return [
          ...newTensions.slice(0, index),
          ...newTensions.slice(index + 1)
        ];
      }
    });

    if (value === null)
    {
      setTensionBoxProps([
        ...tensionBoxProps.slice(0, index),
        ...tensionBoxProps.slice(index + 1)
      ]);
    }
  }

  function loadPreset(preset: string) {
    const stats = presets[preset as keyof typeof presets] as CourseStat[] ?? [];
    setTensionBoxProps(stats);
  }

  return <div id="app-root-container">
    <div>
      Default scale length ({unitNameLookup.weight[measuringSystem]}) used when adding new string
      <input
        type="text"
        id="default-scale"
        step="0.01"
        value={defaultLen}
        onChange={e => setDefaultLen(+e.target.value)}
      />
    </div>
    <div>
      <label>Go metric</label>
      <input type="checkbox"
        onChange={e =>
          setMeasuringSystem(e.target.checked ? Unit.Metric : Unit.US)
        }
      />
    </div>
    <PresetFunctions
      addCourse={addCourse}
      dumpData={dumpData}
      loadData={loadData}
    />
    SaveData:
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
      onChange={e => loadPreset(e.target.value)}
    >
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
          key={JSON.stringify(stat) + '-' + i}
          id={i}
          initStat={stat}
          measuringSystem={measuringSystem}
          update={setTensionAt}
        />
      )
    }
    </div>
  </div>;
}

document.addEventListener('DOMContentLoaded', () => {
  const app = ReactDOM.createRoot(document.getElementById('root')!);
  app.render(
    <>
      <AppInfo />
      <AppRoot />
    </>
  );
});
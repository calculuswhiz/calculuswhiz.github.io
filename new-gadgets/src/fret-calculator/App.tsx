import { useState } from 'react'
import './index.css'

function Table(props: { showing: boolean, scaleLength: number, numFrets: number, exitTable: () => void }) {
  const fretPositions = new Array<number>();
  for (let fretNum = 1; fretNum <= props.numFrets; fretNum++) {
    fretPositions.push(props.scaleLength * (1 - 0.5 ** (fretNum / 12)));
  }

  return (
    <div id="fret-table"
      className={`${props.showing ? '' : 'hidden'}`}>
      <button type='button' id="close-button" onClick={() => props.exitTable()}>
        Close
      </button>
      <table className="border-spacing-0 m-auto">
        <thead>
          <tr>
            <th className="px-1">Fret Number</th>
            <th className="px-1">Position</th>
            <th className="px-1">Done Fretting?</th>
          </tr>
        </thead>
        <tbody>
          {
            fretPositions.map((pos, idx) => <tr key={`row-${idx + 1}`}>
              <td className="border-y border-y-white">{idx + 1}</td>
              <td className="border-y border-y-white">{pos.toFixed(2)}</td>
              <td className="border-y border-y-white">
                <input type="checkbox"
                  className="w-5 h-5" />
              </td>
            </tr>)
          }
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [scaleLength, setScaleLength] = useState(20);
  const [numFrets, setNumFrets] = useState(19);
  const [showTable, setShowTable] = useState(false);

  const tableShowClass = !showTable ? '' : 'hidden';

  return (
    <>
      <header className={tableShowClass}>
        <h2 className="text-2xl font-bold">Fret Slotting Companion</h2>
      </header>
      {/* If showing table, un-show inputs */}
      <table id="inputs" className={`${tableShowClass} text-left text-lg`}>
        <tbody>
          <tr>
            <td className="pr-1 font-bold">
              <label htmlFor="scale-length">Scale Length</label>
            </td>
            <td>
              <input
                className="border border-white"
                type="number"
                id="scale-length"
                value={scaleLength}
                onChange={e => setScaleLength(+e.target.value)} />
            </td>
          </tr>
          <tr>
            <td className="pr-1 font-bold">
              <label htmlFor="num-frets">Number of Frets</label>
            </td>
            <td>
              <input
                className="border border-white"
                type="number"
                id="num-frets"
                value={numFrets}
                onChange={e => setNumFrets(+e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>
      <button
        className={tableShowClass}
        type="button"
        onClick={() => { setShowTable(true) }}>
        Create Table
      </button>
      <Table
        showing={showTable}
        scaleLength={scaleLength}
        numFrets={numFrets}
        exitTable={() => setShowTable(false)} />
    </>
  );
}

export default App

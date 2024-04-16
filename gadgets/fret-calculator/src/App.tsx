import { useState } from 'react'
import './App.scss'

function Table(props: {showing: boolean, scaleLength: number, numFrets: number, exitTable: () => void}) {
  const fretPositions = new Array<number>();
  for (let fretNum = 1; fretNum <= props.numFrets; fretNum++)
  {
    fretPositions.push(props.scaleLength * (1 - 0.5 ** (fretNum / 12)));
  }

  return (
    <div id="fret-table" style={{ display: props.showing ? 'unset' : 'none' }}>
      <input type='button' id="close-button" value="Close" onClick={() => props.exitTable()} />
      <table>
        <thead>
          <tr>
            <th>Fret Number</th>
            <th>Position</th>
            <th>Done Fretting?</th>
          </tr>
        </thead>
        <tbody>
        {
          fretPositions.map((pos, idx) => <tr key={`row-${idx + 1}`}>
            <td>{idx + 1}</td>
            <td>{pos.toFixed(2)}</td>
            <td>
              <input type="checkbox" />
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

  return (
    <>
      <header style={{display: showTable ? 'none' : 'unset'}}>
        <h2>Fretting Companion</h2>
      </header>
      {/* If showing table, un-show inputs */}
      <div id="inputs" style={{display: showTable ? 'none' : 'unset'}}>
        <div className="app-input">
          <label htmlFor="scale-length">Scale Length</label>
          <input type="number"
            id="scale-length"
            value={scaleLength}
            onChange={e => setScaleLength(+e.target.value)} />
        </div>
        <div className="app-input">
          <label htmlFor="num-frets">Number of Frets</label>
          <input type="number"
            id="scale-length"
            value={numFrets}
            onChange={e => setNumFrets(+e.target.value)} />
        </div>
        <input type="button"
          value="Create Table"
          onClick={() => {setShowTable(true)}} />
      </div>
      <Table
        showing={showTable}
        scaleLength={scaleLength}
        numFrets={numFrets}
        exitTable={() => setShowTable(false)} />
    </>
  );
}

export default App

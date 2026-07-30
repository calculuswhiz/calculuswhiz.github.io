import { useState, type JSX, type ReactEventHandler } from 'react'
import { getPaymentData } from './mortgageMethods';

const currencyFormatter = new Intl.NumberFormat(
  'en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
);

function formatDollars(dollars: number) {
  return currencyFormatter.format(dollars);
}

const dateFormatter = new Intl.DateTimeFormat(
  'en-US',
  { dateStyle: 'medium' }
);

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function NumericInput(props: {
  label: string; value: number;
  min?: number; max?: number; step?: number;
  setter: React.Dispatch<React.SetStateAction<number>>
}) {
  return <div className='table-row'>
    <label className='table-cell pb-1'>{props.label}</label>
    <input
      value={props.value}
      onChange={e => props.setter(+e.target.value)}
      className='table-cell pb-1 border border-black' />
  </div>;
}

function TemplateTextDiv(props: {
  /** ? to denote parameter. More than one will not be processed */
  template: string;
  displayItems: (string | number)[]
}) {
  const decomposed = props.template.split(/\?(?!\?)/);

  if (decomposed.length !== props.displayItems.length + 1) {
    throw Error(
      `Cannot process template item. Expected ${decomposed.length} parameters.`
    );
  }

  const nodes = new Array<JSX.Element>();
  for (const [index, text] of decomposed.entries()) {
    nodes.push(<span key={`text${index}`}>{text}</span>);
    nodes.push(
      <strong key={`index${index}`}>
        {
          props.displayItems[index]
        }
      </strong>
    );
  }

  return <div>{nodes.slice(0, -1)}</div>;
}

function HelpPopOver(props: {
  text: string;
  pos: { x: number, y: number };
  onDelete: ReactEventHandler;
}) {
  const trueX = Math.min(window.innerWidth - 100, props.pos.x)

  return <div
    className="fixed border border-black bg-amber-100 font-normal p-1"
    style={{ left: trueX, top: props.pos.y }}
    onClick={props.onDelete}>
    {props.text}
  </div>;
}

function AggregateItem(props: {
  title: string;
  help?: string;
  template: string;
  displayItems: (string | number)[]
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [helpPos, setHelpPos] = useState({ x: 0, y: 0 });

  return <span className="border border-black cursor-default grow">
    <h3
      className="my-1 bg-amber-100"
      title={props.help != null ? "Click to Show Help" : ""}
      onClick={e => {
        setShowHelp(!showHelp);
        setHelpPos({ x: e.clientX, y: e.clientY });
      }}>
      {props.title}
      {
        (showHelp && props.help)
        && <HelpPopOver
          text={props.help} pos={helpPos}
          onDelete={_ => setShowHelp(false)} />
      }
    </h3>
    <TemplateTextDiv template={props.template} displayItems={props.displayItems} />
  </span>;
}

function DataDisplay(props: {
  annualPaymentCycles: number;
  loanPercent: number;
  principal: number;
  initialPayment: number;
  paymentPerCycle: number;
  escrowAdjustment: number;
}) {

  const effectivePrincipal = props.principal - props.initialPayment;
  const compoundRate = props.loanPercent / 100 / props.annualPaymentCycles;

  const parameterValidators: [boolean, string][] = [
    [props.annualPaymentCycles > 0, "Annual Payments is not > 0"],
    [props.loanPercent >= 0, "Loan Percent is not >= 0"],
    [props.principal > 0, "Principal is not > 0"],
    [props.initialPayment >= 0, "Initial Payment is not >= 0"],
    [props.paymentPerCycle > 0, "Payment Per Cycle is not > 0"],
    [effectivePrincipal > 0, "Trivial solution: only 1 payment required."]
  ];
  const failedParams = parameterValidators.filter(p => !p[0]);

  function getPaymentDataForPrincipal(principal: number) {
    if (principal === 0)
      return [];

    try {
      return getPaymentData(
        principal, compoundRate, props.paymentPerCycle,
        props.escrowAdjustment, props.annualPaymentCycles
      );
    } catch (e) {
      return [];
    }
  }

  // Real payment
  const realPaymentData = getPaymentDataForPrincipal(effectivePrincipal);
  const totalInterestPaid = realPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
  const interestEfficiency = 1 - totalInterestPaid / props.principal;
  const finalPaymentDate = realPaymentData.slice(-1)[0]?.timeStamp ?? new Date(Date.now());

  // Speculative payment
  let initialPaymentEffect;
  try {
    const noInitialPaymentData = getPaymentDataForPrincipal(props.principal);
    const interestWithoutInitial = noInitialPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
    initialPaymentEffect = (interestWithoutInitial - totalInterestPaid) / props.principal;
  } catch (_) {
    initialPaymentEffect = NaN;
  }

  const totalPayments = realPaymentData.length - 1;

  if (failedParams.length > 0) {
    return <ul>
      {
        failedParams.map(fp => <li key={fp[1]}>{fp[1]}</li>)
      }
    </ul>;
  }

  return <div id="data-display">
    <header className="flex flex-wrap mb-0.5">
      <AggregateItem
        title="Loan Maturity"
        help="How soon you pay it off"
        template="?, in ? cycles or ? years"
        displayItems={[
          finalPaymentDate.toDateString(),
          totalPayments,
          (totalPayments / props.annualPaymentCycles).toFixed(2)
        ]} />
      <AggregateItem
        title="Total Payment"
        help="Principal + Interest"
        template="?"
        displayItems={[formatDollars(totalInterestPaid + props.principal)]} />
      <AggregateItem
        title="Total Interest"
        help="How much interest is paid when the loan matures"
        template="?"
        displayItems={[formatDollars(totalInterestPaid)]} />
      <AggregateItem
        title="Interest Efficiency"
        help="1 - (Interest paid / original principal)"
        template="?%"
        displayItems={[(100 * interestEfficiency).toFixed(2)]} />
      <AggregateItem
        title="Initial Payment Effect"
        help="How much the initial payment contributes to interest efficiency"
        template="?%"
        displayItems={[(100 * initialPaymentEffect).toFixed(2)]} />
    </header>
    <div id="data-display-container"
      className="w-full overflow-x-auto">
      <table id="data-grid"
        className='border-collapse'>
        <thead className='font-bold'>
          <tr>
            <td className="border-b border-black pr-5 bg-amber-400">Cycle</td>
            <td className="border-b border-black pr-5 bg-amber-400">Date</td>
            <td className="border-b border-black pr-5 bg-amber-400">Payment</td>
            <td className="border-b border-black pr-5 bg-amber-400">Principal</td>
            <td className="border-b border-black pr-5 bg-amber-400">Δ Principal</td>
            <td className="border-b border-black pr-5 bg-amber-400">Interest</td>
            <td className="border-b border-black pr-5 bg-amber-400">Δ Interest</td>
            <td className="border-b border-black pr-5 bg-amber-400">Escrow/other</td>
            <td className="border-b border-black pr-5 bg-amber-400">Remaining Principal</td>
            <td className="border-b border-black pr-5 bg-amber-400">Δ R. Principal</td>
          </tr>
        </thead>
        <tbody>
          {
            realPaymentData.map((payment, idx) => (
              <tr className="odd:bg-gray-200" key={payment.timeStamp.toString()}>
                <td className="p-1">{idx + 1}</td>
                <td className="p-1">{formatDate(payment.timeStamp)}</td>
                <td className="p-1">{formatDollars(payment.totalAmount)}</td>
                <td className="p-1">{formatDollars(payment.principal)}</td>
                <td className="p-1">{formatDollars(payment.dPrincipal)}</td>
                <td className="p-1">{formatDollars(payment.interest)}</td>
                <td className="p-1">{formatDollars(payment.dInterest)}</td>
                <td className="p-1">{formatDollars(props.escrowAdjustment)}</td>
                <td className="p-1">{formatDollars(payment.remainingBalance)}</td>
                <td className="p-1">{formatDollars(payment.dRemainingBalance)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  </div>;
}

function App() {
  const [annualPaymentCycles, setAnnualPaymentCycles] = useState(12);
  const [loanPercent, setLoanPercent] = useState(5);
  const [principal, setPrincipal] = useState(100_000);
  const [initialPayment, setInitialPayment] = useState(0);
  const [paymentPerCycle, setPaymentPerCycle] = useState(1000);
  const [escrowAdjustment, setEscrowAdjustment] = useState(200);

  return <>
    <h1 className="text-2xl font-bold">Mortgage Payment Calculator</h1>
    <div className="flex flex-wrap">
      <div className="table p-5 border border-black">
        <NumericInput
          label="# Annual Payments" value={annualPaymentCycles}
          min={0}
          setter={setAnnualPaymentCycles}
        />
        <NumericInput
          label="Loan Rate (%)" value={loanPercent}
          min={0}
          setter={setLoanPercent} />
        <TemplateTextDiv
          template="-- (Per cycle: ?%)"
          displayItems={[(loanPercent / annualPaymentCycles).toFixed(4)]} />
        <NumericInput
          label="Starting Principal ($)" value={principal}
          min={0} step={1000}
          setter={setPrincipal} />
        <NumericInput
          label="Initial Payment ($)" value={initialPayment}
          min={0} step={1000}
          setter={setInitialPayment} />
        <NumericInput
          label="Payment per cycle ($)" value={paymentPerCycle}
          min={0} step={100}
          setter={setPaymentPerCycle} />
        <NumericInput
          label="Escrow Adjustment (per cycle $)" value={escrowAdjustment}
          min={0} step={10}
          setter={setEscrowAdjustment} />
      </div>
    </div>
    <hr />
    <DataDisplay
      annualPaymentCycles={annualPaymentCycles}
      loanPercent={loanPercent}
      principal={principal}
      initialPayment={initialPayment}
      paymentPerCycle={paymentPerCycle}
      escrowAdjustment={escrowAdjustment} />
  </>;
}

export default App

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
  decimals?: number;
  setter: React.Dispatch<React.SetStateAction<number>>
}) {
  return <div className='table-row'>
    <label className='table-cell pb-1'>{props.label}</label>
    <input
      value={props.value.toFixed(props.decimals ?? 0)}
      onChange={e => props.setter(+parseFloat(parseFloat(e.target.value).toFixed(props.decimals ?? 0)))}
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
        {props.displayItems[index]}
      </strong>
    );
  }

  return <div className="p-1">{nodes.slice(0, -1)}</div>;
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

  return <span className="cursor-default grow">
    <h3
      className="bg-amber-700"
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

function App() {
  const [annualPaymentCycles, setAnnualPaymentCycles] = useState(12);
  const [loanPercent, setLoanPercent] = useState(5);
  const [principal, setPrincipal] = useState(100_000);
  const [initialPayment, setInitialPayment] = useState(0);
  const [paymentPerCycle, setPaymentPerCycle] = useState(1000);
  const [escrowAdjustment, setEscrowAdjustment] = useState(200);

  const effectivePrincipal = principal - initialPayment;
  const compoundRate = loanPercent / 100 / annualPaymentCycles;

  const parameterValidators: [boolean, string][] = [
    [annualPaymentCycles > 0, "Annual Payments is not > 0"],
    [loanPercent >= 0, "Loan Percent is not >= 0"],
    [principal > 0, "Principal is not > 0"],
    [initialPayment >= 0, "Initial Payment is not >= 0"],
    [paymentPerCycle > 0, "Payment Per Cycle is not > 0"],
    [effectivePrincipal > 0, "Trivial solution: only 1 payment required."]
  ];
  const failedParams = parameterValidators.filter(p => !p[0]);

  function getPaymentDataForPrincipal(principal: number) {
    if (principal === 0)
      return [];

    return getPaymentData(
      principal, compoundRate, paymentPerCycle,
      escrowAdjustment, annualPaymentCycles
    ).logErr().unwrapOr([]);
  }

  // Real payment
  const realPaymentData = getPaymentDataForPrincipal(effectivePrincipal);
  const totalInterestPaid = realPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
  const interestEfficiency = 1 - totalInterestPaid / effectivePrincipal;
  const finalPaymentDate = realPaymentData.slice(-1)[0]?.timeStamp ?? new Date(Date.now());

  // Speculative payment
  const noInitialPaymentData = getPaymentDataForPrincipal(principal);
  const interestWithoutInitial = noInitialPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
  const initialPaymentEffect = (interestWithoutInitial - totalInterestPaid) / principal;

  const totalPayments = realPaymentData.length - 1;

  return <>
    <h1 className="text-2xl font-bold">Mortgage Payment Calculator</h1>
    <div className="flex flex-wrap">
      <div className="table p-2 border border-black">
        <NumericInput
          label="# Annual Payments" value={annualPaymentCycles}
          setter={setAnnualPaymentCycles}
        />
        <NumericInput
          label="Loan Rate (%)" value={loanPercent}
          decimals={4}
          setter={setLoanPercent} />
        <TemplateTextDiv
          template="-- (Per cycle: ?%)"
          displayItems={[(loanPercent / annualPaymentCycles).toFixed(4)]} />
        <NumericInput
          label="Starting Principal ($)" value={principal}
          setter={setPrincipal} />
        <NumericInput
          label="Initial Payment ($)" value={initialPayment}
          setter={setInitialPayment} />
        <NumericInput
          label="Payment per cycle ($)" value={paymentPerCycle}
          setter={setPaymentPerCycle} />
        <NumericInput
          label="Escrow Adjustment (per cycle) ($)" value={escrowAdjustment}
          setter={setEscrowAdjustment} />
      </div>
      <div className="flex flex-col p-2 border grow">
        <AggregateItem
          title="Loan Maturity"
          help="How soon you pay it off"
          template="?, in ? cycles or ? years"
          displayItems={[
            finalPaymentDate.toDateString(),
            totalPayments,
            (totalPayments / annualPaymentCycles).toFixed(2)
          ]} />
        <AggregateItem
          title="Total Payment"
          help="Principal + Interest"
          template="?"
          displayItems={[formatDollars(totalInterestPaid + principal)]} />
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
      </div>
    </div>
    <hr />
    {
      failedParams.length > 0
        ? <ul>
          {failedParams.map(fp => <li key={fp[1]}>{fp[1]}</li>)}
        </ul>
        : <div id="data-display">
          <div id="data-display-container"
            className="w-full overflow-x-auto p-1 border bg-gray-500">
            <table id="data-grid"
              className='border-collapse border'>
              <thead className='font-bold'>
                <tr>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Cycle</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Date</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Payment</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Principal</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Δ Principal</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Interest</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Δ Interest</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Escrow/other</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Remaining Principal</td>
                  <td className="border-b border-black pr-5 bg-amber-500 p-1">Δ R. Principal</td>
                </tr>
              </thead>
              <tbody>
                {
                  realPaymentData.map((payment, idx) => (
                    <tr className="odd:bg-gray-500 even:bg-gray-700" key={payment.timeStamp.toString()}>
                      <td className="p-1">{idx + 1}</td>
                      <td className="p-1">{formatDate(payment.timeStamp)}</td>
                      <td className="p-1">{formatDollars(payment.totalAmount)}</td>
                      <td className="p-1">{formatDollars(payment.principal)}</td>
                      <td className="p-1">{formatDollars(payment.dPrincipal)}</td>
                      <td className="p-1">{formatDollars(payment.interest)}</td>
                      <td className="p-1">{formatDollars(payment.dInterest)}</td>
                      <td className="p-1">{formatDollars(escrowAdjustment)}</td>
                      <td className="p-1">{formatDollars(payment.remainingBalance)}</td>
                      <td className="p-1">{formatDollars(payment.dRemainingBalance)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
    }
  </>;
}

export default App

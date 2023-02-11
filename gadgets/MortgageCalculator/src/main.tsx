import React, { ReactEventHandler, useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";
import * as mortgageMethods from './mortgageMethods';
import { ActivityFields } from "./mortgageMethods";

import './styles.scss';

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
	return <div>
		<label>{props.label}</label>
		<input
			type="number" value={props.value}
			min={props.min} max={props.max} step={props.step}
			onChange={e => props.setter(+e.target.value)} />
	</div>;
}

function TemplateTextDiv(props: {
	/** ? to denote parameter. More than one will not be processed */
	template: string;
	displayItems: (string|number)[]
})
{
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
	pos: {x: number, y: number};
	onDelete: ReactEventHandler;
})
{
	const trueX = Math.min(window.innerWidth - 100, props.pos.x)

	return <div
		className="help-popover"
		style={{left: trueX, top: props.pos.y}}
		onClick={props.onDelete}>
		{props.text}
	</div>;
}

function AggregateItem(props: {
	title: string;
	help?: string;
	template: string;
	displayItems: (string|number)[]
})
{
	const [showHelp, setShowHelp] = useState(false);
	const [helpPos, setHelpPos] = useState({x: 0, y: 0});

	return <span className="aggregate-item">
		<h3
			className="aggregate-title"
			title={props.help != null ? "Click to Show Help" : ""}
			onClick={e => {
				setShowHelp(!showHelp);
				setHelpPos({x: e.clientX, y: e.clientY});
			}}>
			{props.title}
			{
				(showHelp && props.help)
					&& <HelpPopOver
						text={props.help} pos={helpPos}
						onDelete={_ => setShowHelp(false)} />
			}
		</h3>
		<TemplateTextDiv template={props.template} displayItems={props.displayItems}/>
	</span>;
}

function DataDisplay(props: {
	annualPaymentCycles: number;
	loanPercent: number;
	principal: number;
	initialPayment: number;
	paymentPerCycle: number;
	escrowAdjustment: number;
	rentPayment: number;
}) {
	const [isShowingGraph, setIsShowingGraph] = useState(true);

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

	if (failedParams.length > 0) {
		return <ul>
		{
			failedParams.map(fp => <li key={fp[1]}>{fp[1]}</li>)
		}
		</ul>;
	}

	function getPaymentDataForPrincipal(principal: number) {
		return mortgageMethods.getPaymentData(
			principal, compoundRate, props.paymentPerCycle,
			props.escrowAdjustment, props.annualPaymentCycles
		);
	}

	try {
		// Real payment
		const realPaymentData = getPaymentDataForPrincipal(effectivePrincipal);
		const totalInterestPaid = realPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
		const interestEfficiency = 1 - totalInterestPaid / props.principal;
		const finalPaymentDate = realPaymentData.slice(-1)[0].timeStamp;

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
		const intBreakEvenCycles = Math.ceil(totalInterestPaid / props.rentPayment);
		const totalPayment = totalInterestPaid + props.principal;
		const totalBreakEvenCycles = Math.ceil(totalPayment / props.rentPayment);

		useEffect(() => {
			if (!isShowingGraph)
				return;

			const canvas = document.getElementById('data-graph') as HTMLCanvasElement|null;
			if (canvas == null){
				console.error('Cannot get canvas');
				return;
			}

			const ctx = canvas.getContext('2d')!;
			if (ctx == null) {
				console.error('Cannot get 2d context');
				return;
			}

			const width = canvas.width;
			const height = canvas.height;

			function mapFunc(dataX: number, dataY: number,
				maxX: number, maxY: number
			) {
				return [
					dataX / maxX * width,
					(1 - dataY / maxY) * height
				].map(Math.floor);
			}

			function graphProperty<T>(
				data: T[],
				xValPredicate: (val: T) => number,
				yValPredicate: (val: T) => number,
				maxXData: number, maxYData: number,
				color: string
			) {
				ctx.beginPath();
				ctx.strokeStyle = color;
				const [firstX, firstY] = mapFunc(
					0, yValPredicate(data[0]),
					maxXData, maxYData);
				ctx.moveTo(firstX, firstY);
				for (const entry of data.slice(1)) {
					const [curX, curY] = mapFunc(
						xValPredicate(entry), yValPredicate(entry),
						maxXData, maxYData
					);
					ctx.lineTo(curX, curY);
				}
				ctx.stroke();
			}

			ctx.clearRect(0, 0, width, height);

			const now = Date.now();

			graphProperty(
				realPaymentData,
				val => val.timeStamp.getTime() - now,
				val => val.remainingBalance,
				finalPaymentDate.getTime() - Date.now(),
				effectivePrincipal,
				'black'
			);
			graphProperty(
				realPaymentData,
				val => val.timeStamp.getTime() - now,
				val => val.principal / (val.principal + val.interest),
				finalPaymentDate.getTime() - Date.now(),
				1,
				'blue'
			);
		}, [realPaymentData, isShowingGraph]);

		return <div id="data-display">
			<header>
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
			<header>
				{
					props.rentPayment > 0
					&& <AggregateItem
						title="Rent-interest break-even point"
						help="How long until rent pays for interest"
						template="? cycles, or ? years"
						displayItems={[
							intBreakEvenCycles,
							(intBreakEvenCycles / props.annualPaymentCycles).toFixed(2)
						]} />
 				}
 				{
					props.rentPayment > 0
					&& <AggregateItem
						title="Rent-total break-even point"
						help="How long until rent pays for entire loan"
						template="? cycles, or ? years"
						displayItems={[
							totalBreakEvenCycles,
							(totalBreakEvenCycles / props.annualPaymentCycles).toFixed(2)
						]} />
 				}
			</header>
			<div id="display-settings">
				<input type="button" value="Show/Hide Graph" onClick={_ => setIsShowingGraph(!isShowingGraph)} />
				<div id="legend">
					<strong>Key</strong>
					<div id="keys">
						<strong style={{color: 'blue'}}>
							Principal:Payment Ratio
						</strong>
						<strong style={{color: 'black'}}>
							Remaining Balance
						</strong>
					</div>
				</div>
			</div>
			{
				isShowingGraph
					&& <canvas id="data-graph" width={600} height={300}></canvas>
			}
			<div id="data-display-container">
				<table id="data-grid">
					<thead>
						<tr>
							<td>Cycle</td>
							<td>Date</td>
							<td>Payment</td>
							<td>Principal</td>
							<td>Δ Principal</td>
							<td>Interest</td>
							<td>Δ Interest</td>
							<td>Escrow/other</td>
							<td>Remaining Principal</td>
							<td>Δ R. Principal</td>
						</tr>
					</thead>
					<tbody>
					{
						realPaymentData.map((payment, idx) => (
							<tr key={payment.timeStamp.toString()}>
								<td>{idx + 1}</td>
								<td>{formatDate(payment.timeStamp)}</td>
								<td>{formatDollars(payment.totalAmount)}</td>
								<td>{formatDollars(payment.principal)}</td>
								<td>{formatDollars(payment.dPrincipal)}</td>
								<td>{formatDollars(payment.interest)}</td>
								<td>{formatDollars(payment.dInterest)}</td>
								<td>{formatDollars(props.escrowAdjustment)}</td>
								<td>{formatDollars(payment.remainingBalance)}</td>
								<td>{formatDollars(payment.dRemainingBalance)}</td>
							</tr>
						))
					}
					</tbody>
				</table>
			</div>
		</div>;
	} catch (e: any) {
		if (e instanceof Error)
			return <>{e.message}</>;
		else
			return <>Calculation failed!</>;
	}
}

function AppRoot() {
	// Required
	const [annualPaymentCycles, setAnnualPaymentCycles] = useState(12);
	const [loanPercent, setLoanPercent] = useState(5);
	const [principal, setPrincipal] = useState(100_000);
	const [initialPayment, setInitialPayment] = useState(0);
	const [paymentPerCycle, setPaymentPerCycle] = useState(1000);
	const [escrowAdjustment, setEscrowAdjustment] = useState(200);

	// Others
	const [rentPayment, setRentPayment] = useState(0);

	return <>
		<div id="input-fields">
			<div className="input-set">
				<h2>Required inputs</h2>
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
					label="Starting Principal" value={principal}
					min={0} step={1000}
					setter={setPrincipal} />
				<NumericInput
					label="Initial Payment" value={initialPayment}
					min={0} step={1000}
					setter={setInitialPayment} />
				<NumericInput
					label="Payment per cycle" value={paymentPerCycle}
					min={0} step={100}
					setter={setPaymentPerCycle} />
				<NumericInput
					label="Escrow Adjustment (per cycle)" value={escrowAdjustment}
					min={0} step={10}
					setter={setEscrowAdjustment} />
			</div>
			<div className="input-set">
				<h2>Other inputs</h2>
				<NumericInput
					label="Rent per cycle" value={rentPayment}
					min={0} step={100}
					setter={setRentPayment} />
			</div>
		</div>
		<hr />
		<DataDisplay
			annualPaymentCycles={annualPaymentCycles}
			loanPercent={loanPercent}
			principal={principal}
			initialPayment={initialPayment}
			paymentPerCycle={paymentPerCycle}
			escrowAdjustment={escrowAdjustment}
			rentPayment={rentPayment} />
	</>;
}

document.addEventListener('DOMContentLoaded', () => {
	const appRoot = ReactDOM.createRoot(document.getElementById('app-root-container')!);
	appRoot.render(<AppRoot />);
});

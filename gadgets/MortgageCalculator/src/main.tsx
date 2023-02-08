import React, { useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";

import './styles.scss';

function AppInfo() {
	return <>
		<header>
			<h1>Generic Mortgage Payment Calculator</h1>
		</header>
	</>;
}

function NumericInput(props: {
	id: string; label: string; value: number;
	setter: React.Dispatch<React.SetStateAction<number>>
}) {
	return <div id={props.id}>
		<label>{props.label}</label>
		<input type="number" value={props.value}
			onChange={e => props.setter(+e.target.value)} />
	</div>;
}

type ActivityFields = {
	timeStamp: Date;
	totalAmount: number;
	principal: number;
	interest: number;
	remainingBalance: number;
};

const millisPerYear = 365.24 * 24 * 60 * 60 * 1000;

function getPaymentData(
	principal: number, compoundRate: number, paymentPerCycle: number,
	escrowAdjustment: number, paymentCycles: number
) {
	const millisPerCycle = millisPerYear / paymentCycles;

	const paymentData: ActivityFields[] = [];

	let remainingBalance = principal;
	let millis = new Date().getTime();

	while (remainingBalance >= 0) {
		const interest = compoundRate * remainingBalance;
		const principalPayment = paymentPerCycle - interest - escrowAdjustment;

		paymentData.push({
            timeStamp: new Date(millis),
            totalAmount: paymentPerCycle,
            remainingBalance: remainingBalance,
            principal: principalPayment,
            interest: interest
        });

        millis += millisPerCycle;
        remainingBalance -= principalPayment;
	}

	if (remainingBalance < 0) {
		// Zero out the balance
		const finalPayment = paymentData.slice(-1)[0].remainingBalance + escrowAdjustment;
		paymentData.push({
			timeStamp: new Date(millis + millisPerCycle),
			totalAmount: finalPayment,
			remainingBalance: 0,
			principal: finalPayment,
			interest: 0
		});
	}

	return paymentData;
}

/** Do not calculate if this much principal cannot be paid */
const lifeGuard = 100;

function DataDisplay(props: {
	paymentCycles: number;
	loanPercent: number;
	principal: number;
	initialPayment: number;
	paymentPerCycle: number;
	escrowAdjustment: number;
}) {
	const effectivePrincipal = props.principal - props.initialPayment;
	const compoundRate = props.loanPercent / 100 / props.paymentCycles;

	if (props.paymentPerCycle - lifeGuard
		<= props.escrowAdjustment + compoundRate * effectivePrincipal
	) {
		return <div>
			This will take too long!
			You are paying {props.paymentPerCycle}.
			You need to pay {props.escrowAdjustment + compoundRate * effectivePrincipal + lifeGuard} for this calculator to work.
		</div>;
	}

	const getPaymentDataForPrincipal =
		(principal: number) => getPaymentData(
			principal, compoundRate, props.paymentPerCycle,
			props.escrowAdjustment, props.paymentCycles
		);

	// Real payment
	const realPaymentData = getPaymentDataForPrincipal(effectivePrincipal);
	const totalInterestPaid = realPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
	const interestEfficiency = 1 - totalInterestPaid / props.principal;
	const finalPaymentDate = realPaymentData.slice(-1)[0].timeStamp;

	// Speculative payment
	const noInitialPaymentData = getPaymentDataForPrincipal(props.principal);
	const interestWithoutInitial = noInitialPaymentData.reduce((prev, cur) => prev + cur.interest, 0);
	const initialPaymentEffect = (interestWithoutInitial - totalInterestPaid) / props.principal;

	return <div id="data-display">
		<header>
			<span>Payoff in {realPaymentData.length - 1} payments</span>
			<span>Total Interest: {totalInterestPaid.toFixed(2)}</span>
			<span title="Higher is better">
				Interest Efficiency: {(100 * interestEfficiency).toFixed(2)}%
			</span>
			<span>
				Initial Payment effect: {(100 * initialPaymentEffect).toFixed(2)}%
			</span>
			<span>Final payment: {finalPaymentDate.toDateString()}</span>
		</header>
		<table id="data-grid">
			<thead>
				<tr>
					<td>Payment #</td>
					<td>Date</td>
					<td>Payment</td>
					<td>Principal</td>
					<td>Interest</td>
					<td>Escrow/other</td>
					<td>Remaining Principal</td>
				</tr>
			</thead>
			<tbody>
			{
				realPaymentData.map((payment, idx) => (
					<tr key={payment.timeStamp.toString()}>
						<td>{idx + 1}</td>
						<td>{payment.timeStamp.toDateString()}</td>
						<td>{payment.totalAmount.toFixed(2)}</td>
						<td>{payment.principal.toFixed(2)}</td>
						<td>{payment.interest.toFixed(2)}</td>
						<td>{props.escrowAdjustment.toFixed(2)}</td>
						<td>{payment.remainingBalance.toFixed(2)}</td>
					</tr>
				))
			}
			</tbody>
		</table>
	</div>;
}

function AppRoot() {
	const [paymentCycles, setPaymentCycles] = useState(12);
	const [loanPercent, setLoanPercent] = useState(3);
	const [principal, setPrincipal] = useState(100_000);
	const [initialPayment, setInitialPayment] = useState(0);
	const [paymentPerCycle, setPaymentPerCycle] = useState(1000);
	const [escrowAdjustment, setEscrowAdjustment] = useState(0);

	return <>
		<div id="input-fields">
			<NumericInput
				id="payment-cycles-field"
				label="Payments Per Year" value={paymentCycles}
				setter={setPaymentCycles}
			/>
			<NumericInput
				id="loan-rate-field"
				label="Loan Rate (%)" value={loanPercent}
				setter={setLoanPercent} />
			<div>-- (Per cycle: {(loanPercent / paymentCycles).toFixed(4)}%)</div>
			<NumericInput
				id="principal-field"
				label="Starting Principal (P)" value={principal}
				setter={setPrincipal} />
			<NumericInput
				id="initial-payment-field"
				label="Initial Payment" value={initialPayment}
				setter={setInitialPayment} />
			<NumericInput
				id="payment-per-cycle-field"
				label="Payment per cycle" value={paymentPerCycle}
				setter={setPaymentPerCycle} />
			<NumericInput
				id="escrow-adjustment-field"
				label="Escrow Adjustment (per cycle)" value={escrowAdjustment}
				setter={setEscrowAdjustment} />
		</div>
		<hr />
		<DataDisplay
			paymentCycles={paymentCycles}
			loanPercent={loanPercent}
			principal={principal}
			initialPayment={initialPayment}
			paymentPerCycle={paymentPerCycle}
			escrowAdjustment={escrowAdjustment} />
	</>;
}

document.addEventListener('DOMContentLoaded', () => {
	const appInfo = ReactDOM.createRoot(document.getElementById('app-info-container')!);
	appInfo.render(<AppInfo />);
	const appRoot = ReactDOM.createRoot(document.getElementById('app-root-container')!);
	appRoot.render(<AppRoot />);
});

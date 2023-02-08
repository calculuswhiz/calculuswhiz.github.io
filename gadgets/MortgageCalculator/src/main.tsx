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
	label: string; value: number;
	setter: React.Dispatch<React.SetStateAction<number>>
}) {
	return <div>
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

/** Do not calculate if this much principal cannot be paid */
const noCalcPercent = .1;

function getPaymentData(
	principal: number, compoundRate: number, paymentPerCycle: number,
	escrowAdjustment: number, paymentCycles: number
) {
	const paymentThreshold = (escrowAdjustment
			+ (compoundRate * principal)) * (1 + noCalcPercent / 100);

	if (paymentPerCycle <= paymentThreshold) {
		throw Error(`Payment ${paymentPerCycle} is below the threshold ${paymentThreshold}. Cannot calculate.`);
	}

	const millisPerCycle = millisPerYear / paymentCycles;

	const paymentData: ActivityFields[] = [];

	let remainingBalance = principal;
	let millis = new Date().getTime();

	while (remainingBalance >= 0) {
		const interest = compoundRate * remainingBalance;
		const principalPayment = paymentPerCycle - interest - escrowAdjustment;

		if (principalPayment <= 0) {
			throw Error('Negative principal payment detected. Terminating.');
		}

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
		const finalBalance = paymentData.slice(-1)[0].remainingBalance;
		paymentData.push({
			timeStamp: new Date(millis + millisPerCycle),
			totalAmount: finalBalance + escrowAdjustment,
			remainingBalance: 0,
			principal: finalBalance,
			interest: 0
		});
	}

	return paymentData;
}

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

	const parameterValidators: [boolean, string][] = [
		[props.paymentCycles > 0, "Payment Cycles is not > 0"],
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
		return getPaymentData(
			principal, compoundRate, props.paymentPerCycle,
			props.escrowAdjustment, props.paymentCycles
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

		return <div id="data-display">
			<header>
				<span>
					{realPaymentData.length - 1} payments,
					matures on {finalPaymentDate.toDateString()}
				</span>
				<span>Total Interest: {totalInterestPaid.toFixed(2)}</span>
				<span title="Higher is better">
					Interest Efficiency: {(100 * interestEfficiency).toFixed(2)}%
				</span>
				<span>
					Initial Payment effect: {(100 * initialPaymentEffect).toFixed(2)}%
				</span>
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
	} catch (e: any) {
		if (e instanceof Error)
			return <>{e.message}</>;
		else
			return <>Calculation failed!</>;
	}
}

function AppRoot() {
	const [paymentCycles, setPaymentCycles] = useState(12);
	const [loanPercent, setLoanPercent] = useState(5);
	const [principal, setPrincipal] = useState(100_000);
	const [initialPayment, setInitialPayment] = useState(0);
	const [paymentPerCycle, setPaymentPerCycle] = useState(1000);
	const [escrowAdjustment, setEscrowAdjustment] = useState(200);

	return <>
		<div id="input-fields">
			<NumericInput
				label="Payments Per Year" value={paymentCycles}
				setter={setPaymentCycles}
			/>
			<NumericInput
				label="Loan Rate (%)" value={loanPercent}
				setter={setLoanPercent} />
			<div>-- (Per cycle: {(loanPercent / paymentCycles).toFixed(4)}%)</div>
			<NumericInput
				label="Starting Principal (P)" value={principal}
				setter={setPrincipal} />
			<NumericInput
				label="Initial Payment" value={initialPayment}
				setter={setInitialPayment} />
			<NumericInput
				label="Payment per cycle" value={paymentPerCycle}
				setter={setPaymentPerCycle} />
			<NumericInput
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

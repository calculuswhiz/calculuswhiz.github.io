import { err, ok } from "@/lib/NeverEverThrow/sync";

export type ActivityFields = {
	timeStamp: Date;
	totalAmount: number;
	principal: number;
	dPrincipal: number;
	interest: number;
	dInterest: number
	remainingBalance: number;
	dRemainingBalance: number;
};

export const millisPerYear = 365.24 * 24 * 60 * 60 * 1000;

/** Do not calculate if this much principal cannot be paid */
export const noCalcPercent = .1;

export function getPaymentData(
	principal: number, compoundRate: number, paymentPerCycle: number,
	escrowAdjustment: number, paymentCycles: number
) {
	const paymentThreshold = (escrowAdjustment
		+ (compoundRate * principal)) * (1 + noCalcPercent / 100);

	if (paymentPerCycle <= paymentThreshold) {
		return err(Error(
			`Payment ${paymentPerCycle} is below the threshold ${paymentThreshold}. Cannot calculate.`
		));
	}

	const millisPerCycle = millisPerYear / paymentCycles;

	const paymentData: ActivityFields[] = [];

	let remainingBalance = principal;
	let millis = Date.now();

	while (remainingBalance >= 0) {
		const interest = compoundRate * remainingBalance;
		const principalPayment = paymentPerCycle - interest - escrowAdjustment;

		if (principalPayment <= 0) {
			return err(Error('Negative principal payment detected. Terminating.'));
		}

		const prevEntry = paymentData.slice(-1)[0];

		paymentData.push({
			timeStamp: new Date(millis),
			totalAmount: paymentPerCycle,
			remainingBalance: remainingBalance,
			dRemainingBalance: remainingBalance - (prevEntry?.remainingBalance ?? 0),
			principal: principalPayment,
			dPrincipal: principalPayment - (prevEntry?.principal ?? 0),
			interest: interest,
			dInterest: interest - (prevEntry?.interest ?? 0),
		});

		millis += millisPerCycle;
		remainingBalance -= principalPayment;
	}

	if (remainingBalance < 0) {
		// Zero out the balance

		const penultimateEntry = paymentData.slice(-1)[0]
		const finalBalance = penultimateEntry?.remainingBalance ?? 0;
		paymentData.push({
			timeStamp: new Date(millis + millisPerCycle),
			totalAmount: finalBalance + escrowAdjustment,
			remainingBalance: 0,
			dRemainingBalance: 0 - (penultimateEntry?.remainingBalance ?? 0),
			principal: finalBalance,
			dPrincipal: finalBalance - (penultimateEntry?.principal ?? 0),
			interest: 0,
			dInterest: 0 - (penultimateEntry?.interest ?? 0),
		});
	}

	return ok(paymentData);
}
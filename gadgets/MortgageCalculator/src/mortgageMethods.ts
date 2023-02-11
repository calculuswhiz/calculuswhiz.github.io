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
		throw Error(
			`Payment ${paymentPerCycle} is below the threshold ${paymentThreshold}. Cannot calculate.`
		);
	}

	const millisPerCycle = millisPerYear / paymentCycles;

	const paymentData: ActivityFields[] = [];

	let remainingBalance = principal;
	let millis = Date.now();

	while (remainingBalance >= 0) {
		const interest = compoundRate * remainingBalance;
		const principalPayment = paymentPerCycle - interest - escrowAdjustment;

		if (principalPayment <= 0) {
			throw Error('Negative principal payment detected. Terminating.');
		}

		const prevEntry = paymentData.slice(-1)[0];

		paymentData.push({
            timeStamp: new Date(millis),
            totalAmount: paymentPerCycle,
            remainingBalance: remainingBalance,
            dRemainingBalance: remainingBalance - prevEntry?.remainingBalance,
            principal: principalPayment,
            dPrincipal: principalPayment - prevEntry?.principal,
            interest: interest,
            dInterest: interest - prevEntry?.interest,
        });

        millis += millisPerCycle;
        remainingBalance -= principalPayment;
	}

	if (remainingBalance < 0) {
		// Zero out the balance

		const penultimateEntry = paymentData.slice(-1)[0]
		const finalBalance = penultimateEntry.remainingBalance;
		paymentData.push({
            timeStamp: new Date(millis + millisPerCycle),
            totalAmount: finalBalance + escrowAdjustment,
            remainingBalance: 0,
            dRemainingBalance: 0 - penultimateEntry.remainingBalance,
            principal: finalBalance,
            dPrincipal: finalBalance - penultimateEntry.principal,
            interest: 0,
            dInterest: 0 - penultimateEntry.interest,
        });
	}

	return paymentData;
}
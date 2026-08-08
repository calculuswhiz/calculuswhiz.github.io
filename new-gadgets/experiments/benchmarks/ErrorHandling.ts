import { isErrorLike } from "@/lib/isErrorLike";
import { formatNum } from "./util";
import { err as NetErr, ok as NetOk } from "@/lib/NeverEverThrow/sync";
import { err as NTErr, ok as NTOk } from "neverthrow";

/* Findings:
	Typical result is:
1,239.51ms (5000000,0) Error path try-catch
 501.3ms (5000000,0) Error path instanceof Error
482.19ms (5000000,0) Error path Error.isError Error
481.91ms (5000000,0) Error path isErrorLike
618.92ms (5000000,0) Error path neverEverThrow
614.45ms (5000000,0) Error path neverthrow
590.21ms (5000000,0) Error path neverThrow-

 34.83ms (0,5000000) NonError path try-catch
 50.86ms (0,5000000) NonError path instanceof Error
 58.07ms (0,5000000) NonError path Error.isError Error
 48.89ms (0,5000000) NonError path isErrorLike
 58.27ms (0,5000000) NonError path neverEverThrow
 76.38ms (0,5000000) NonError path neverthrow
 62.16ms (0,5000000) NonError path neverThrow-

Conclusions:
- If you don't want to throw/catch, simply returning a union with a distinct type is faster than using result types.
*/

const iterations = 1e7;

function evenOddThrowing(n: number) {
	if (n % 2 === 0)
		throw new Error();
	else
		return 1;
}

function evenOddNoThrowing(n: number) {
	if (n % 2 === 0)
		return new Error();
	else
		return 1;
}

function evenOddNeverEverThrow(n: number) {
	if (n % 2 === 0)
		return NetErr(new Error);
	else
		return NetOk(1);
}

function evenOddNeverthrow(n: number) {
	if (n % 2 === 0)
		return NTErr(new Error);
	else
		return NTOk(1);
}

function okLite<T>(x: T) {
	return { isOk: true, value: x } as const;
}

function errLite<E>(e: E) {
	return { isOk: false, error: e } as const;
}

function evenOddNeverThrowLite(n: number) {
	if (n % 2 === 0)
		return errLite(new Error);
	else
		return okLite(1);
}

for (let startNum = 0; startNum < 2; startNum++) {
	const counters: [number, number] = [0, 0];
	let lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		try {
			evenOddThrowing(i);
			counters[1]++;
		}
		catch {
			counters[0]++;
		}
	}
	const kind = startNum === 0 ? "Error" : "NonError";
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path try-catch`);

	[counters[0], counters[1]] = [0, 0];
	lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		const e = evenOddNoThrowing(i);
		if (e instanceof Error)
			counters[0]++;
		else
			counters[1] += e;
	}
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path instanceof Error`);

	[counters[0], counters[1]] = [0, 0];
	lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		const e = evenOddNoThrowing(i);
		if (Error.isError(e))
			counters[0]++;
		else
			counters[1] += e;
	}
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path Error.isError Error`);

	[counters[0], counters[1]] = [0, 0];
	lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		const e = evenOddNoThrowing(i);
		if (isErrorLike(e))
			counters[0]++;
		else
			counters[1] += e;
	}
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path isErrorLike`);

	[counters[0], counters[1]] = [0, 0];
	lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		const e = evenOddNeverEverThrow(i);
		if (e.isErr)
			counters[0]++;
		else
			counters[1] += e.value;
	}
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path neverEverThrow`);

	[counters[0], counters[1]] = [0, 0];
	lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		const e = evenOddNeverthrow(i);
		if (e.isErr())
			counters[0]++;
		else
			counters[1] += e.value;
	}
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path neverthrow`);

	[counters[0], counters[1]] = [0, 0];
	lastTime = performance.now();
	for (let i = startNum; i < iterations; i += 2) {
		const e = evenOddNeverThrowLite(i);
		if (!e.isOk)
			counters[0]++;
		else
			counters[1] += e.value;
	}
	console.log(`${formatNum(performance.now() - lastTime)}ms (${counters[0]},${counters[1]}) ${kind} path neverThrow-`);

	console.log();
}

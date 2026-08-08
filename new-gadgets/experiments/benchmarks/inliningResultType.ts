import { formatNum } from "./util";

const iterations = 1e8;

function okLite<T>(x: T) {
  return { isOk: true, value: x };
}

function errLite<E>(e: E) {
  return { isOk: false, error: e };
}

let counter = 0;
let lastTime = performance.now();
for (let i = 0; i < iterations; i++) {
  const x = okLite(i);
  if (x.isOk)
    counter++;
}
console.log(`${counter} - ${formatNum(performance.now() - lastTime)}ms okLite`);

counter = 0;
lastTime = performance.now();
for (let i = 0; i < iterations; i++) {
  const x = { isOk: true, value: i };
  if (x.isOk)
    counter++;
}

console.log(`${counter} - ${formatNum(performance.now() - lastTime)}ms inline Ok`);

counter = 0;
lastTime = performance.now();
for (let i = 0; i < iterations; i++) {
  const x = errLite(undefined);
  if (!x.isOk)
    counter++;
}
console.log(`${counter} - ${formatNum(performance.now() - lastTime)}ms errLite`);

counter = 0;
lastTime = performance.now();
for (let i = 0; i < iterations; i++) {
  const x = { isOk: false, error: undefined };
  if (!x.isOk)
    counter++;
}

console.log(`${counter} - ${formatNum(performance.now() - lastTime)}ms inline Err`);

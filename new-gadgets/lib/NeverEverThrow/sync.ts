import type { If } from "../helpers";
import type { ResultAsync } from "./async";

export type ResultCommon<TOk extends boolean, T, E> = {
  /** Result is OK. Usually easier to check isErr instead */
  readonly isOk: TOk;
  /** Defined for convenience. Opposite of isOk. */
  readonly isErr: If<TOk, false, true>;

  /** Unwrap if Ok, otherwise give supplied value */
  unwrapOr<U>(defaultValue: U): If<TOk, T, U>;
  /** Chain another result-producing function if Ok, otherwise propagate the error */
  andThen<U, F>(
    fn: (arg: T) => Result<U, F>
  ): If<TOk, Result<U, F>, Err<E>>;
  /** Similar to andThen, but turns the result into an asynchronous one */
  andThenAsync<U, F>(
    fn: (arg: T) => ResultAsync<U, F>
  ): If<TOk, ResultAsync<U, F>, Err<E>>;
  /** Similar to andThen, but accumulates success results. If any in the chain
   * fail, the first error is returned.
   */
  accumulate<U, F>(fn: (arg: T) => Result<U, F>): Result<readonly [T, U], E | F>;
  /** If the result is Ok, map to another value */
  mapOk<U>(fn: (arg: T) => U): If<TOk, Ok<U>, Err<E>>;
  /** If the result is Err, map to another value */
  mapErr<U>(fn: (arg: E) => U): If<TOk, Ok<T>, Err<U>>;
  /** Log the value */
  logErr(): If<TOk, Ok<T>, Err<E>>;
};

class Ok<T> implements ResultCommon<true, T, never> {
  readonly isOk = true;
  readonly isErr = false;

  readonly value: T;
  constructor(value: T) {
    this.value = value;
  }

  unwrapOr = () => this.value

  mapOk = <U>(fn: (arg: T) => U) => ok(fn(this.value))

  andThen = <U, F>(
    fn: (arg: T) => Result<U, F>
  ) => fn(this.value)

  andThenAsync = <U, F>(
    fn: (arg: T) => ResultAsync<U, F>
  ) => fn(this.value)

  accumulate = <U, F>(fn: (arg: T) => Result<U, F>) => {
    const result = fn(this.value);
    if (result.isErr)
      return err(result.error);
    return ok([this.value, result.value] as const);
  }

  mapErr = () => this

  logErr = () => this
}

class Err<E> implements ResultCommon<false, never, E> {
  readonly isOk = false;
  readonly isErr = true;

  readonly error: E;
  constructor(error: E) {
    this.error = error;
  }

  unwrapOr = <U>(defaultValue: U) => defaultValue

  andThen = () => this

  andThenAsync = () => this

  accumulate = () => this

  mapOk = () => this

  mapErr = <U>(
    fn: (arg: E) => U
  ): Err<U> => new Err(fn(this.error))

  logErr = () => {
    console.error(this.error);
    return this;
  }
}

/** Combined result type */
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T) {
  return new Ok(value);
}

export function err<E>(error: E) {
  return new Err(error);
}
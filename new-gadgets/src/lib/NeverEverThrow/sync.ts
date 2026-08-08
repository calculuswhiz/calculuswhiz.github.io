import type { If } from "../helpers";
import { ResultAsync, type OkAsync } from "./async";

/** 
 * We use this interface instead of one class with conditionals.
 * Compare to {@link ResultAsync} version.
 * Any speed tradeoff should favor runtime over static analysis.
 */
export type ResultCommon<TOk extends boolean, T, E> = {
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
  /** Chain another result-producing function if Err, otherwise propagate the Ok value */
  orElse<U, F>(fn: (arg: E) => Result<U, F>): If<TOk, Ok<T>, Result<U, F>>;
  /** Similar to orElse, but turns the result into an asynchronous one */
  orElseAsync<U, F>(
    fn: (arg: E) => ResultAsync<U, F>
  ): If<TOk, Ok<T>, ResultAsync<U, F>>;
  /** If the result is Ok, map to another value */
  mapOk<U>(fn: (arg: T) => U): If<TOk, Ok<U>, Err<E>>;
  /** Similar to mapOk, but returns a Promise-wrapped result */
  mapOkAsync<U>(
    fn: (arg: T) => Promise<U>
  ): If<TOk, ResultAsync<U, E>, Err<E>>;
  /** If the result is Err, map to another value */
  mapErr<U>(fn: (arg: E) => U): If<TOk, Ok<T>, Err<U>>;
  /** Log the value */
  logErr(): If<TOk, Ok<T>, Err<E>>;
};

export type ResultProps<TOk> = {
  readonly isOk: TOk;
  readonly isErr: TOk extends true ? false : true;
};

export class Ok<T> implements ResultCommon<true, T, never>, ResultProps<true> {
  readonly isOk = true;
  readonly isErr = false;

  constructor(readonly value: T) { }

  unwrapOr() {
    return this.value;
  }

  mapOk<U>(fn: (arg: T) => U) {
    return new Ok(fn(this.value));
  }

  mapOkAsync<U>(fn: (arg: T) => Promise<U>): OkAsync<U> {
    return new ResultAsync<U, never>(
      Promise.resolve(this.value).then(fn)
        .catch(error => error)
    );
  }

  andThen<U, F>(
    fn: (arg: T) => Result<U, F>
  ) {
    return fn(this.value);
  }

  andThenAsync<U, F>(
    fn: (arg: T) => ResultAsync<U, F>
  ) {
    return fn(this.value);
  }

  orElse() {
    return this;
  }
  orElseAsync() {
    return this;
  }

  mapErr() {
    return this;
  }

  logErr() {
    return this;
  }
}

export class Err<E> implements ResultCommon<false, never, E>, ResultProps<false> {
  readonly isOk = false;
  readonly isErr = true;

  constructor(readonly error: E) { }

  unwrapOr<U>(defaultValue: U) {
    return defaultValue;
  }

  andThen() {
    return this;
  }
  andThenAsync() {
    return this;
  }

  orElse<U, F>(fn: (arg: E) => Result<U, F>) {
    return fn(this.error);
  }
  orElseAsync<U, F>(fn: (arg: E) => ResultAsync<U, F>) {
    return fn(this.error);
  }

  mapOk() {
    return this;
  }
  mapOkAsync() {
    return this;
  }

  mapErr<U>(fn: (arg: E) => U) {
    return new Err(fn(this.error));
  }

  logErr() {
    console.error(this.error);
    return this;
  }
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T) {
  return new Ok(value);
}

export function err<E>(error: E) {
  return new Err(error);
}
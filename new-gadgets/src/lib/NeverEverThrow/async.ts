import { Err, Ok, type Result } from "./sync";

type EitherSyncOrAsync<T, E> = Result<T, E> | ResultAsync<T, E>;
type MaybePromise<T> = Promise<T> | T;

/** The asynchronous version of Result. To get a result, await the instance.
 * Any of the methods can be awaited as well.
 * To create a ResultAsync from a Promise, use the helper method {@link resultAsync}. The error
 * will be defined by the .catch(), which should return an Error.
 * 
*/
/* We cannot use two different types for the error and value.
 The promise must resolve to a Result<T, E>. It cannot be known until it
 is resolved. */
export class ResultAsync<T, E> implements PromiseLike<Result<T, E>> {
  /** Have to maintain an internal promise. */
  private _promise: Promise<Result<T, E>>;

  constructor(promise: Promise<Result<T, E>>) {
    this._promise = promise;
  }

  // oxlint-disable-next-line unicorn/no-thenable This is intended as a PromiseLike, so we need to implement then()
  then<TResult1, TResult2>(
    res?: (value: Result<T, E>) => MaybePromise<TResult1>,
    rej?: (reason: any) => MaybePromise<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this._promise.then(res, rej);
  };

  /** Unwrap if Ok, otherwise give supplied value */
  async unwrapOr<U>(defaultValue: U): Promise<T | U> {
    return (await this._promise).unwrapOr(defaultValue);
  }

  /** If the result is Ok, map to another value */
  mapOk<U>(fn: (arg: T) => MaybePromise<U>): ResultAsync<U, E> {
    return new ResultAsync(this._promise.then(
      async result => result.isOk
        ? new Ok(await fn(result.value))
        : result
    ));
  }

  /** Chain another result-producing function if Ok, otherwise propagate the error */
  andThen<U, F>(
    fn: (arg: T) => EitherSyncOrAsync<U, F>
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(this._promise.then(
      async result => result.isErr
        ? result
        : await fn(result.value)
    ));
  }

  /** Chain  */
  orElse<U, F>(fn: (arg: E) => EitherSyncOrAsync<U, F>): ResultAsync<T | U, F> {
    return new ResultAsync<T | U, F>(this._promise.then(
      async result => result.isOk
        ? result
        : await fn(result.error)
    ));
  }

  /** If the result is Err, map to another value */
  mapErr<F>(
    fn: (arg: E) => MaybePromise<F>
  ): ResultAsync<T, F> {
    return new ResultAsync(this._promise.then(
      async result => result.isOk
        ? result
        : new Err(await fn(result.error))
    ));
  }

  /** Log the value */
  logErr(): ResultAsync<T, E> {
    return new ResultAsync(this._promise.then(
      async result => result.logErr()
    ));
  }
}

export type OkAsync<T> = ResultAsync<T, never>;
export type ErrAsync<E> = ResultAsync<never, E>;

/** 
 * Create a {@link ResultAsync} from a promise.
 * Error handling is done by the .catch() of the promise.
 */
export function resultAsync<T, E>(
  promise: Promise<Result<T, E>>,
  errHandler?: (err: unknown) => E
): ResultAsync<T, E> {
  return new ResultAsync(
    promise
      .catch(error => new Err(
        errHandler != null
          ? errHandler(error)
          : error as E
      ))
  );
}

export function okAsync<T>(value: T): OkAsync<T> {
  return new ResultAsync(Promise.resolve(new Ok(value)));
}

export function errAsync<E>(error: E): ErrAsync<E> {
  return new ResultAsync(Promise.resolve(new Err(error)));
}

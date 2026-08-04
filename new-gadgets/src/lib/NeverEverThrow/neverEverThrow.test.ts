import { okAsync, errAsync, ResultAsync, resultAsync } from "./async";
import { describe, expect, test } from "bun:test";
import { err, ok, type Result } from "./sync";

function basicResult(arg: boolean): Result<true, false> {
  return arg ? ok(true) : err(false);
}

function basicAsyncResult(arg: boolean): ResultAsync<true, false> {
  return arg ? okAsync(true) : errAsync(false);
}

function waitAndReturn<T>(arg: T, delay: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(arg), delay);
  });
}

describe("NeverEverThrow", () => {
  describe("Sync methods", () => {
    test("mapOk", () => {
      const result = basicResult(true);
      const mapped = result.mapOk((x) => !x);
      if (!mapped.isOk)
        throw new Error("Expected Ok result");

      expect(mapped.value).toBe(false);
    });

    test("andThen with Result", () => {
      const result = basicResult(true);
      const okResult = result.andThen(x => ok(!x));
      if (!okResult.isOk)
        throw new Error("Expected Ok result");
      expect(okResult.value).toBe(false);
    });
  });

  describe("Async methods", () => {
    describe("mapOk", () => {
      test("with ok", async () => {
        const result = basicAsyncResult(true);
        const mapped = await result.mapOk((x) => !x);
        if (!mapped.isOk)
          throw new Error("Expected Ok result");
        expect(mapped.value).toBe(false);
      });

      test("with err", async () => {
        let landMine = false;
        const result = basicAsyncResult(false);
        const mapped = await result.mapOk((x) => {
          landMine = true;
          return !x;
        });
        if (!mapped.isErr)
          throw new Error("Expected Err result");
        expect(mapped.error).toBe(false);
        expect(landMine).toBe(false);
      });
    });

    describe("andThen", () => {
      test("with Result", async () => {
        const result = basicAsyncResult(true);
        const okResult = await result.andThen(x => ok(!x));
        if (!okResult.isOk)
          throw new Error("Expected Ok result");
        expect(okResult.value).toBe(false);
      });

      test("chained with Result", async () => {
        const result = okAsync(3);
        const okResult1 = await result
          .andThen(x => resultAsync(
            waitAndReturn(ok(x ** 2), 20),
            () => new Error("Should not happen")
          ))
          .andThen(x => ok(x + 3));
        if (!okResult1.isOk)
          throw new Error("Expected Ok result");
        expect(okResult1.value).toBe(12);

        const okResult2 = await result
          .andThen(x => resultAsync(
            waitAndReturn(ok(x + 3), 20),
            () => new Error("Should not happen")
          ))
          .andThen(x => ok(x ** 2));
        if (!okResult2.isOk)
          throw new Error("Expected Ok result");
        expect(okResult2.value).toBe(36);
      });
    });
  });

  describe("Mixed methods", () => {
    test("andThenAsync with Result", async () => {
      const result = basicResult(true);
      const okResult = await result.andThenAsync(x => okAsync(!x));
      if (!okResult.isOk)
        throw new Error("Expected Ok result");
      expect(okResult.value).toBe(false);
    });
  });
});

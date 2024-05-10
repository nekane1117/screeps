/// <reference types="lodash" />
declare type Falsey = false | 0 | "" | null | undefined;

declare module _ {
  //_.compact
  interface LoDashStatic {
    /**
     * Creates an array with all falsey values removed. The values false, null, 0, "", undefined, and NaN are
     * falsey.
     *
     * @param array The array to compact.
     * @return (Array) Returns the new array of filtered values.
     */
    compact<T>(array?: List<T>): Exclude<T, Falsey>[];
  }

  interface LoDashImplicitArrayWrapper<T> {
    /**
     * @see _.compact
     */
    compact(): LoDashImplicitArrayWrapper<Exclude<T, Falsey>>;
  }

  interface LoDashImplicitObjectWrapper<T> {
    /**
     * @see _.compact
     */
    compact<TResult>(): LoDashImplicitArrayWrapper<Exclude<TResult, Falsey>>;
  }

  interface LoDashExplicitArrayWrapper<T> {
    /**
     * @see _.compact
     */
    compact(): LoDashExplicitArrayWrapper<Exclude<T, Falsey>>;
  }

  interface LoDashExplicitObjectWrapper<T> {
    /**
     * @see _.compact
     */
    compact<TResult>(): LoDashExplicitArrayWrapper<Exclude<TResult, Falsey>>;
  }

  //_.first
  interface LoDashStatic {
    /**
     * Gets the first element of array.
     *
     * @alias _.head
     *
     * @param array The array to query.
     * @return Returns the first element of array.
     */
    first<T>(array: List<T>): T | undefined;
  }

  interface LoDashImplicitWrapper<T> {
    /**
     * @see _.first
     */
    first(): string | undefined;
  }

  interface LoDashImplicitArrayWrapper<T> {
    /**
     * @see _.first
     */
    first(): T | undefined;
  }

  interface LoDashImplicitObjectWrapper<T> {
    /**
     * @see _.first
     */
    first<T>(): T | undefined;
  }

  interface LoDashExplicitWrapper<T> {
    /**
     * @see _.first
     */
    first(): LoDashExplicitWrapper<string | undefined>;
  }

  interface LoDashExplicitArrayWrapper<T> {
    /**
     * @see _.first
     */
    first<T>(): T | undefined;
  }

  interface LoDashExplicitObjectWrapper<T> {
    /**
     * @see _.first
     */
    first<T>(): T | undefined;
  }
}

import {ControllerFunc} from "./controllers";

export type NonEmptyArray<T> = T[] & { 0: T };
export type NotEmptyArray<T> = [T, ...T[]];
export type NonEmpty<T> = T extends Array<infer U> ? U[] & {'0': U} : never;
export type ControllerMethodNames<T> = {
  [K in keyof T]: T[K] extends ControllerFunc ? K : never;
}[keyof T];

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

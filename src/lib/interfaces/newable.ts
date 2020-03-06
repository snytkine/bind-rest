export type Newable<T> = {
  new?(...args: any[]): T;
  name?: string;
  prototype?: any;
  length?: number;
};

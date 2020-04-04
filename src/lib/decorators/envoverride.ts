export default function EnvOverride<T extends { new (...args: any[]): {} }>(target: T) {
  return class extends target {
    constructor(...args: any[]) {
      super(args);

      /**
       * @todo what is target here?
       */
      return new Proxy(this, {
        get(target, property) {
          if (typeof property === 'string' || typeof property === 'number') {
            return process.env[`${property}`] || target[property];
          }
          return target[property];
        },
      });
    }
  };
}

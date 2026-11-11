const COMMANDS = ["get", "incr", "expire", "hget", "hset", "hincrby", "hgetall"];

export class MemoryRedis {
  constructor() {
    this.strings = new Map();
    this.hashes = new Map();
  }

  async get(key) {
    return this.strings.has(key) ? this.strings.get(key) : null;
  }

  async incr(key) {
    const next = (Number(this.strings.get(key)) || 0) + 1;
    this.strings.set(key, next);
    return next;
  }

  async expire() {
    return 1;
  }

  async hget(key, field) {
    const hash = this.hashes.get(key);
    return hash && hash.has(field) ? hash.get(field) : null;
  }

  async hset(key, values) {
    const hash = this.hashes.get(key) ?? new Map();
    for (const [field, value] of Object.entries(values)) hash.set(field, value);
    this.hashes.set(key, hash);
    return Object.keys(values).length;
  }

  async hincrby(key, field, increment) {
    const hash = this.hashes.get(key) ?? new Map();
    const next = (Number(hash.get(field)) || 0) + increment;
    hash.set(field, next);
    this.hashes.set(key, hash);
    return next;
  }

  async hgetall(key) {
    const hash = this.hashes.get(key);
    return hash && hash.size > 0 ? Object.fromEntries(hash) : null;
  }

  multi() {
    const queued = [];
    const chain = {
      exec: async () => {
        const results = [];
        for (const [name, args] of queued) results.push(await this[name](...args));
        return results;
      },
    };
    for (const name of COMMANDS) {
      chain[name] = (...args) => {
        queued.push([name, args]);
        return chain;
      };
    }
    return chain;
  }

  pipeline() {
    return this.multi();
  }
}

export function createRequest({ method = "POST", body, ip = "203.0.113.7" } = {}) {
  return { method, body, headers: { "x-forwarded-for": ip }, socket: { remoteAddress: ip } };
}

export function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

export async function call(handler, options) {
  const res = createResponse();
  await handler(createRequest(options), res);
  return res;
}

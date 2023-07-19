import crypto from "crypto";
import { match } from "ts-pattern";

import type { Clock } from "~/core/services/clock";
import type { HttpClient } from "~/core/services/http-client";
import { concatenateBufferArrays } from "~/core/utils/buffers";

import type { InferKrakenResponse, KrakenEndpoint, KrakenHttpClient } from "./kraken-http-client";

export interface KrakenHttpClientLiveOptions {
  baseURL?: string;
  version?: number;
  publicKey: string;
  privateKey: string;
}

export class KrakenHttpClientLive implements KrakenHttpClient {
  readonly #clock: Clock;
  readonly #httpClient: HttpClient;
  readonly #options: KrakenHttpClientLiveOptions;

  constructor(clock: Clock, httpClient: HttpClient, options: KrakenHttpClientLiveOptions) {
    this.#clock = clock;
    this.#httpClient = httpClient;
    this.#options = options;
  }

  async request<TEndpoint extends KrakenEndpoint>({ type, name, options }: TEndpoint) {
    const endpoint = this.#endpoint(type, name);
    const request = await match(type)
      .with("public", () => this.#publicEndpointRequest(endpoint, options))
      .with("private", () => this.#privateEndpointRequest(endpoint, options))
      .exhaustive();

    const response = await this.#httpClient.request(request);
    const responseBody: unknown = await response.json();

    return responseBody as InferKrakenResponse<TEndpoint>;
  }

  #publicEndpointRequest(endpoint: string, options: Record<string, unknown> = {}) {
    const endpointURL = this.#endpointURL(endpoint);
    const params = this.#params(options);

    return new Request(endpointURL, { method: "POST", body: params });
  }

  async #privateEndpointRequest(endpoint: string, options: Record<string, unknown> = {}) {
    const nonce = this.#nonce();
    const endpointURL = this.#endpointURL(endpoint);
    const params = this.#params({ ...options, nonce });
    const signingKey = await this.#signingKey(endpoint, params, nonce);
    const headers = this.#headers(signingKey);

    return new Request(endpointURL, { method: "POST", headers, body: params });
  }

  #endpoint(type: string, name: string) {
    const version = this.#options.version ?? 0;
    return `/${version}/${type}/${name}`;
  }

  #endpointURL(endpoint: string) {
    const baseURL = this.#options.baseURL ?? "https://api.kraken.com";
    return new URL(`${baseURL}${endpoint}`);
  }

  #params(options: Record<string, unknown>) {
    const params = Object.entries(options).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((nestedValue) => [key, String(nestedValue)])
        : [[key, String(value)]],
    );

    return new URLSearchParams(params);
  }

  #headers(signingKey: string) {
    const headers = new Headers();

    headers.append("api-key", this.#options.publicKey);
    headers.append("api-sign", signingKey);

    return headers;
  }

  #nonce() {
    return this.#clock.currentTime().getTime() * 1000;
  }

  async #signingKey(endpoint: string, params: URLSearchParams, nonce: number) {
    const encoder = new TextEncoder();
    const encodedEndpoint = encoder.encode(endpoint);
    const encodedOptions = encoder.encode(`${nonce}${params.toString()}`);
    const encodedPrivateKey = Uint8Array.from(
      atob(this.#options.privateKey),
      (char) => char.codePointAt(0) ?? 0,
    );

    const algorithm = { name: "HMAC", hash: "SHA-512" };

    const [requestHash, hmacKey] = await Promise.all([
      crypto.subtle.digest("SHA-256", encodedOptions),
      crypto.subtle.importKey("raw", encodedPrivateKey, algorithm, true, ["sign"]),
    ]);

    const combinedHash = concatenateBufferArrays(encodedEndpoint, new Uint8Array(requestHash));
    const signingKeyBuffer = await crypto.subtle.sign("HMAC", hmacKey, combinedHash);

    return btoa(String.fromCharCode(...new Uint8Array(signingKeyBuffer)));
  }
}

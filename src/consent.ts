/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable prefer-const */

import timingSafeEqual from "@ansugroup/timing-safe-equal";
import { ObjectMultiplex, Substream } from "@toruslabs/openlogin-jrpc";
import * as crypto from "crypto-browserify";
import * as ethers from "ethers";
import Web3Token from "web3-token";

import config from "./config";
import UpbondInpageProvider from "./inpage-provider";
import { ConsentDidResponse } from "./interfaces";

export default class Consent {
  consentApiKey: string;

  communicationMux: ObjectMultiplex;

  provider: UpbondInpageProvider;

  consentConfigurations: {
    scopes: string[];
    enabled: boolean;
  };

  key: string;

  isLoggedIn: boolean;

  didIntervalRequest: number;

  isDidDeployed: boolean;

  consentStreamName: { consent: string; listenerStream: string };

  didCreationCb: Record<any, any>;

  constructor({
    consentApiKey,
    key,
    scope,
    consentStream,
    provider,
    isLoggedIn = false,
    didIntervalRequest = 5000,
  }: {
    consentApiKey: string;
    key: string;
    scope: string[];
    consentStream: ObjectMultiplex;
    provider: UpbondInpageProvider;
    isLoggedIn?: boolean;
    didIntervalRequest?: number;
  }) {
    if (consentApiKey && key) {
      this.didIntervalRequest = didIntervalRequest;
      this.isLoggedIn = isLoggedIn;
      this.consentConfigurations = {
        enabled: false,
        scopes: scope,
      };
      this.consentApiKey = consentApiKey;
      this.key = key;
      this.communicationMux = consentStream;
      this.provider = provider;
      this.isDidDeployed = false;
      this.consentStreamName = {
        consent: "consent",
        listenerStream: "did_listener_stream",
      };
      this.didCreationCb = {};

      this.listenDidCreation();
    }
  }

  init() {
    // prechecking keys
    if (!this.consentApiKey) {
      throw new Error(`Missing client id`);
    }
    if (!this.key) {
      throw new Error(`Missing secret key`);
    }
    if (!this.consentConfigurations.scopes || this.consentConfigurations.scopes.length === 0) {
      throw new Error(`Missing scope`);
    }
    console.log(`Consent management ready to go`);
    this.consentConfigurations.enabled = true;
  }

  getDid(): Promise<{
    jwt: string;
    jwtPresentation: string;
  }> {
    return new Promise((resolve, reject) => {
      const stream = this.communicationMux.getStream(this.consentStreamName.consent) as Substream;
      stream.write({
        name: "request",
        data: {
          scope: this.consentConfigurations.scopes,
          clientId: this.consentApiKey,
          secretKey: this.key,
          host: window.location.host,
        },
      });
      stream.on("data", (data) => {
        if (data.name === "error") {
          if (data.data.code && data.data.code === 401) {
            this.isDidDeployed = false;
            this.didCreationCb = data.data.params;
            resolve({
              jwt: "",
              jwtPresentation: "",
            });
          }
          reject(new Error(data.data.msg));
        } else {
          this.isDidDeployed = true;
          resolve(data.data);
        }
      });
    });
  }

  requestDIDCreationOrFilledForm(clientId: string, params: { [x: string]: any }, secKey: string): Promise<ConsentDidResponse> {
    return new Promise((resolve, reject) => {
      try {
        const ethProvider = new ethers.providers.Web3Provider(this.provider);
        const signer = ethProvider.getSigner();
        Web3Token.sign(
          async (msg: string) => {
            const data = {
              domain: "example.com",
              scope: this.consentConfigurations.scopes,
              type: "did_creation_request",
              data: {
                clientId,
                clientSecret: secKey,
                params,
              },
              expires_in: "3 days",
              msg,
            };
            const tx = await signer.signMessage(JSON.stringify(data));
            return tx;
          },
          {
            domain: "example.com",
            expires_in: "3 days",
          }
        );
        const stream = this.communicationMux.getStream("consent") as Substream;
        stream.on("data", (data) => {
          if (data.name === "consent_response") {
            resolve(data.data);
          } else if (data.name === "consent_error") {
            reject(data.data.msg);
          }
        });
        stream.on("error", (err) => {
          reject(err);
        });
      } catch (error) {
        if (error.message && error.message.includes("user rejected signing")) {
          reject(new Error("User rejected your request"));
        }
        reject(error);
      }
    });
  }

  requestUserData(did: { jwt: string; jwtPresentation: string }, cb?: (stream: Substream) => void): Promise<ConsentDidResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isDidDeployed || (did.jwt === "" && did.jwtPresentation === "")) {
        const data = this.requestDIDCreationOrFilledForm(
          this.consentApiKey,
          Object.keys(this.didCreationCb).length > 0 ? this.didCreationCb : {},
          this.key
        );
        resolve(data);
        return;
      }
      if (cb && typeof cb !== "function") {
        reject(new Error(`Callback must be a function`));
      }
      if (!did || !did.jwt || !did.jwtPresentation) {
        reject(new Error(`Missing did object`));
      }
      const { jwt, jwtPresentation } = did;
      const stream = this.communicationMux.getStream("consent") as Substream;
      try {
        const ethProvider = new ethers.providers.Web3Provider(this.provider);
        const signer = ethProvider.getSigner();
        Web3Token.sign(
          async (msg: string) => {
            const data = {
              domain: this.isLocalhost() ? "example.com" : new URL(window.location.origin).hostname,
              scope: this.consentConfigurations.scopes,
              type: "consent_request",
              data: {
                vc: jwt,
                vp: jwtPresentation,
              },
              expires_in: "3 days",
              msg,
            };
            const tx = await signer.signMessage(JSON.stringify(data));
            return tx;
          },
          {
            domain: this.isLocalhost() ? "example.com" : new URL(window.location.origin).hostname,
            expires_in: "3 days",
          }
        );
        if (cb) {
          const consentStream = this.communicationMux.getStream("consent_stream") as Substream;
          cb(consentStream);
        }
        stream.on("data", (data) => {
          if (data.name === "consent_response") {
            resolve(data.data);
            stream.destroy();
          } else if (data.name === "consent_error") {
            reject(data.data.msg);
            stream.destroy();
          }
        });
        stream.on("error", (err) => {
          reject(err);
          stream.destroy();
        });
      } catch (error) {
        if (error.message && error.message.includes("user rejected signing")) {
          reject(new Error("User rejected your request"));
          stream.destroy();
        }
        reject(error);
        stream.destroy();
      }
    });
  }

  protected listenDidCreation() {
    const stream = this.communicationMux.getStream(this.consentStreamName.listenerStream) as Substream;
    stream.write({
      name: config.DID_STREAM_NAME.REQUEST,
      data: {
        interval: this.didIntervalRequest,
      },
    });
    stream.on("data", (ev) => {
      if (ev.name && ev.name === config.DID_STREAM_NAME.RESULT) {
        if (ev.data) {
          this.isDidDeployed = true;
        } else {
          this.isDidDeployed = false;
        }
      }
    });
  }

  protected isLocalhost(): boolean {
    return new URL(window.location.origin).hostname === "localhost";
  }

  protected _createDigest(encodedData: crypto.BinaryLike, format: crypto.BinaryToTextEncoding) {
    return crypto.createHmac("sha256", this.key).update(encodedData).digest(format);
  }

  protected _decode(value: string) {
    let [encodedData, sourceDigest] = value.split("!");
    if (!encodedData || !sourceDigest) throw new Error("invalid value(s)");
    const json = Buffer.from(encodedData, "base64").toString("utf8");
    const decodedData = JSON.parse(json);
    const checkDigest = this._createDigest(encodedData, "base64");
    const digestsEqual = timingSafeEqual(sourceDigest, checkDigest);
    if (!digestsEqual) throw new Error("invalid value(s)");
    return decodedData;
  }
}

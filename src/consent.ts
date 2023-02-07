/* eslint-disable no-console */
/* eslint-disable prefer-const */

import timingSafeEqual from "@ansugroup/timing-safe-equal";
import { ObjectMultiplex, Substream } from "@toruslabs/openlogin-jrpc";
import * as crypto from "crypto-browserify";
import * as ethers from "ethers";
import Web3Token from "web3-token";

import UpbondInpageProvider from "./inpage-provider";

export default class Consent {
  consentApiKey: string;

  communicationMux: ObjectMultiplex;

  provider: UpbondInpageProvider;

  consentConfigurations: {
    scopes: string[];
    enabled: boolean;
  };

  key: string;

  constructor({
    consentApiKey,
    key,
    scope,
    consentStream,
    provider,
  }: {
    consentApiKey: string;
    key: string;
    scope: string[];
    consentStream: ObjectMultiplex;
    provider: UpbondInpageProvider;
  }) {
    if (consentApiKey && key) {
      this.consentConfigurations = {
        enabled: false,
        scopes: scope,
      };
      this.consentApiKey = consentApiKey;
      this.key = key;
      this.communicationMux = consentStream;
      this.provider = provider;
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
      const stream = this.communicationMux.getStream("consent") as Substream;
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
          reject(new Error(data.data.msg));
        } else {
          console.log(data.data, "@data DID?");
          resolve(data.data);
        }
      });
    });
  }

  requestUserData(did: { jwt: string; jwtPresentation: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!did || !did.jwt || !did.jwtPresentation) {
        reject(new Error(`Missing did object`));
      }
      const { jwt, jwtPresentation } = did;
      try {
        const ethProvider = new ethers.providers.Web3Provider(this.provider);
        const signer = ethProvider.getSigner();
        Web3Token.sign(
          async (msg: string) => {
            const data = {
              domain: "example.com",
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
            domain: "example.com",
            expires_in: "3 days",
          }
        );
        const stream = this.communicationMux.getStream("consent") as Substream;
        stream.on("data", (data) => {
          if (data.name === "consent_response") {
            resolve(data.data);
          }
        });
        stream.on("error", (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
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

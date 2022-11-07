/* eslint-disable no-console */
import { IBcHandler } from "./interfaces";
import PopupHandler from "./PopupHandler";
import { FEATURES_DEFAULT_WALLET_WINDOW } from "./utils";

class BcHandler extends PopupHandler {
  bc: BroadcastChannel;

  url: URL;

  constructor({ url, channelName }: IBcHandler) {
    super({ url, target: "_self", features: FEATURES_DEFAULT_WALLET_WINDOW });
    this.bc = new BroadcastChannel(channelName);
    this.url = url;
  }

  handle(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.once("close", async () => {
        const urlInstance = new URLSearchParams(window.location.search).get("instanceId");
        if (urlInstance && urlInstance !== "") {
          const bc = new BroadcastChannel(`torus_logout_channel_${urlInstance}`);
          await bc.postMessage({ data: { type: "logout" } });
          bc.close();
        }

        reject(new Error("user closed popup"));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.bc.addEventListener("message", async (ev: any) => {
        try {
          const { error, data } = ev;
          if (error) {
            reject(new Error(error));
          }
          if (ev.data.type === "popup_result" && ev.data.keys.length === 0) {
            reject(new Error("not existing keys"));
          }
          if (data.keys[0].privKey.length < 64) data.keys[0].privKey = `0${data.keys[0].privKey}`;
          if (data.keys[0].privKey.length > 64) data.keys[0].privKey = data.keys[0].privKey.slice(1);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      const res = this.open();
      return res;
    });
  }
}

export default BcHandler;

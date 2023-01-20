/* eslint-disable no-console */
import { get, setAPIKey } from "@toruslabs/http-helpers";
import { BasePostMessageStream, JRPCRequest, ObjectMultiplex, setupMultiplex, Substream } from "@toruslabs/openlogin-jrpc";
import deepmerge from "lodash.merge";

import configuration from "./config";
import { documentReady, handleStream, htmlToElement, runOnLoad } from "./embedUtils";
import UpbondInpageProvider from "./inpage-provider";
import generateIntegrity from "./integrity";
import {
  BUTTON_POSITION,
  BUTTON_POSITION_TYPE,
  EMBED_TRANSLATION_ITEM,
  IUpbondEmbedParams,
  LOGIN_PROVIDER,
  NetworkInterface,
  PAYMENT_PROVIDER_TYPE,
  PaymentParams,
  TorusCtorArgs,
  TorusLoginParams,
  TorusPublicKey,
  UnvalidatedJsonRpcRequest,
  UPBOND_BUILD_ENV,
  UserInfo,
  VerifierArgs,
  WALLET_OPENLOGIN_VERIFIER_MAP,
  WALLET_PATH,
  WhiteLabelParams,
} from "./interfaces";
import log from "./loglevel";
import PopupHandler from "./PopupHandler";
import sendSiteMetadata from "./siteMetadata";
import {
  defaultLoginParam,
  defaultLoginParamProd,
  defaultLoginParamStg,
  FEATURES_CONFIRM_WINDOW,
  FEATURES_DEFAULT_WALLET_WINDOW,
  FEATURES_PROVIDER_CHANGE_WINDOW,
  getPreopenInstanceId,
  getUpbondWalletUrl,
  getUserLanguage,
  searchToObject,
  validatePaymentProvider,
} from "./utils";

const defaultVerifiers = {
  [LOGIN_PROVIDER.GOOGLE]: true,
  [LOGIN_PROVIDER.FACEBOOK]: true,
  [LOGIN_PROVIDER.REDDIT]: true,
  [LOGIN_PROVIDER.TWITCH]: true,
  [LOGIN_PROVIDER.DISCORD]: true,
};

const iframeIntegrity = "sha384-RhqFseQpufEgNnJYPxNXx+EmyE55iWEWJwkgS7QX/pit6STKFZRf9K9kwmfpDIPw";

const expectedCacheControlHeader = "max-age=3600";

const UNSAFE_METHODS = [
  "eth_sendTransaction",
  "eth_signTypedData",
  "eth_signTypedData_v3",
  "eth_signTypedData_v4",
  "personal_sign",
  "eth_getEncryptionPublicKey",
  "eth_decrypt",
];

// preload for iframe doesn't work https://bugs.chromium.org/p/chromium/issues/detail?id=593267
(async function preLoadIframe() {
  try {
    if (typeof document === "undefined") return;
    const upbondIframeHtml = document.createElement("link");
    const { torusUrl } = await getUpbondWalletUrl("production", { check: false, hash: iframeIntegrity, version: "" });
    upbondIframeHtml.href = `${torusUrl}/popup`;
    upbondIframeHtml.crossOrigin = "anonymous";
    upbondIframeHtml.type = "text/html";
    upbondIframeHtml.rel = "prefetch";
    if (upbondIframeHtml.relList && upbondIframeHtml.relList.supports) {
      if (upbondIframeHtml.relList.supports("prefetch")) {
        log.info("IFrame loaded");
        document.head.appendChild(upbondIframeHtml);
      }
    }
  } catch (error) {
    log.warn(error);
  }
})();

export const ACCOUNT_TYPE = {
  NORMAL: "normal",
  THRESHOLD: "threshold",
  IMPORTED: "imported",
};

class Upbond {
  buttonPosition: BUTTON_POSITION_TYPE = BUTTON_POSITION.BOTTOM_LEFT;

  buttonSize: number;

  torusUrl: string;

  upbondIframe: HTMLIFrameElement;

  skipDialog: boolean;

  styleLink: HTMLLinkElement;

  isLoggedIn: boolean;

  isInitialized: boolean;

  torusAlert: HTMLDivElement;

  apiKey: string;

  modalZIndex: number;

  alertZIndex: number;

  torusAlertContainer: HTMLDivElement;

  isIframeFullScreen: boolean;

  whiteLabel: WhiteLabelParams;

  requestedVerifier: string;

  currentVerifier: string;

  embedTranslations: EMBED_TRANSLATION_ITEM;

  ethereum: UpbondInpageProvider;

  provider: UpbondInpageProvider;

  communicationMux: ObjectMultiplex;

  isUsingDirect: boolean;

  isLoginCallback: () => void;

  dappRedirectUrl: string;

  paymentProviders = configuration.paymentProviders;

  selectedVerifier: string;

  private loginHint = "";

  private useWalletConnect: boolean;

  private isCustomLogin = false;

  buildEnv: typeof UPBOND_BUILD_ENV[keyof typeof UPBOND_BUILD_ENV];

  widgetConfig: { showAfterLoggedIn: boolean; showBeforeLoggedIn: boolean };

  constructor({ buttonPosition = BUTTON_POSITION.BOTTOM_LEFT, buttonSize = 56, modalZIndex = 99999, apiKey = "torus-default" }: TorusCtorArgs = {}) {
    this.buttonPosition = buttonPosition;
    this.buttonSize = buttonSize;
    this.torusUrl = "";
    this.isLoggedIn = false; // ethereum.enable working
    this.isInitialized = false; // init done
    this.requestedVerifier = "";
    this.currentVerifier = "";
    this.apiKey = apiKey;
    setAPIKey(apiKey);
    this.modalZIndex = modalZIndex;
    this.alertZIndex = modalZIndex + 1000;
    this.isIframeFullScreen = false;
    this.isUsingDirect = false;
    this.buildEnv = "production";
    this.widgetConfig = {
      showAfterLoggedIn: true,
      showBeforeLoggedIn: false,
    };
  }

  async init({
    buildEnv = UPBOND_BUILD_ENV.PRODUCTION,
    enableLogging = false,
    // deprecated: use loginConfig instead
    enabledVerifiers = defaultVerifiers,
    network = {
      host: "mumbai",
      chainId: 80001,
      networkName: "Mumbai",
      blockExplorer: "",
      ticker: "MUMBAI",
      tickerName: "MUMBAI",
      rpcUrl: "https://winter-yolo-sea.ropsten.discover.quiknode.pro/356a09ba08edbed5d5f626dfdd447a768c0c338d/",
    },
    loginConfig = defaultLoginParam,
    widgetConfig,
    integrity = {
      check: false,
      hash: iframeIntegrity,
      version: "",
    },
    whiteLabel,
    skipTKey = false,
    useWalletConnect = false,
    isUsingDirect = true,
    mfaLevel = "default",
    selectedVerifier,
    skipDialog = false,
    dappRedirectUri = window.location.origin,
  }: IUpbondEmbedParams = {}): Promise<void> {
    // Send WARNING for deprecated buildEnvs
    // Give message to use others instead
    let buildTempEnv = buildEnv;
    if (buildEnv === "v2_development") {
      log.warn(
        `[UPBOND-EMBED] WARNING! This buildEnv is deprecating soon. Please use 'UPBOND_BUILD_ENV.DEVELOPMENT' instead to point wallet on DEVELOPMENT environment.`
      );
      log.warn(`More information, please visit https://github.com/upbond/embed`);
      buildTempEnv = "development";
    }
    if (buildEnv === "v2_production") {
      log.warn(
        `[UPBOND-EMBED] WARNING! This buildEnv is deprecating soon. Please use 'UPBOND_BUILD_ENV.PRODUCTION' instead to point wallet on PRODUCTION environment.`
      );
      log.warn(`More information, please visit https://github.com/upbond/embed`);
      buildTempEnv = "production";
    }
    if (buildEnv === "v2_new-dev-local") {
      log.warn(
        `[UPBOND-EMBED] WARNING! This buildEnv is deprecating soon. Please use 'UPBOND_BUILD_ENV.LOCAL' instead to point wallet on LOCAL environment.`
      );
      log.warn(`More information, please visit https://github.com/upbond/embed`);
      buildTempEnv = "new-dev-local";
    }

    if (buildEnv.includes("v1")) {
      log.warn(
        `[UPBOND-EMBED] WARNING! This buildEnv is deprecating soon. Please use 'UPBOND_BUILD_ENV.LOCAL|DEVELOPMENT|STAGING|PRODUCTION' instead to point wallet on each environment`
      );
      log.warn(`More information, please visit https://github.com/upbond/embed`);
    }

    buildEnv = buildTempEnv;
    log.info(`Using buildEnv: `, buildEnv);

    // Enable/Disable logging
    if (enableLogging) log.enableAll();
    else log.disableAll();

    // Check env staging / production, set LoginConfig
    let loginConfigTemp = loginConfig;
    if (JSON.stringify(loginConfig) === JSON.stringify(defaultLoginParam)) {
      // For development, using the defaultloginparam
      // For staging, using defaultLoginParamStg
      if (buildEnv.includes("staging")) loginConfigTemp = defaultLoginParamStg;
      // For production, using defaultLoginParamProd
      if (buildEnv.includes("production")) loginConfigTemp = defaultLoginParamProd;
      loginConfig = loginConfigTemp;
    }
    log.info(`Using login config: `, loginConfig);

    // If not staging/production, use testnet configuration
    if (!buildEnv.includes("staging") && !buildEnv.includes("production")) {
      log.warn(`[UPBOND-EMBED] WARNING! You are on testnet environment.`);
      network = {
        host: "mumbai",
        chainId: 80001,
        networkName: "Mumbai",
        blockExplorer: "",
        ticker: "MUMBAI",
        tickerName: "MUMBAI",
        rpcUrl: "https://winter-yolo-sea.ropsten.discover.quiknode.pro/356a09ba08edbed5d5f626dfdd447a768c0c338d/",
      };
    }
    log.info(`Using network config: `, network);

    if (this.isInitialized) throw new Error("Already initialized");

    const { torusUrl, logLevel } = await getUpbondWalletUrl(buildEnv, integrity);

    log.info(`Url Loaded: ${torusUrl} with log: ${logLevel}`);

    if (!widgetConfig) {
      log.info(`widgetConfig is not configured. Now using default widget configuration`);
    } else {
      this.widgetConfig = widgetConfig;
    }

    if (selectedVerifier) {
      try {
        const isAvailableOnLoginConfig = loginConfig[selectedVerifier];
        if (isAvailableOnLoginConfig) {
          this.selectedVerifier = selectedVerifier;
        } else {
          throw new Error("Selected verifier is not exist on your loginConfig");
        }
      } catch (error) {
        throw new Error("Selected verifier is not exist on your loginConfig");
      }
    }

    this.buildEnv = buildEnv;
    this.skipDialog = skipDialog;
    this.dappRedirectUrl = dappRedirectUri;
    this.isUsingDirect = isUsingDirect;
    this.torusUrl = torusUrl;
    this.whiteLabel = whiteLabel;
    this.useWalletConnect = useWalletConnect;
    this.isCustomLogin = !!(loginConfig && Object.keys(loginConfig).length > 0) || !!(whiteLabel && Object.keys(whiteLabel).length > 0);
    log.setDefaultLevel(logLevel);

    const upbondIframeUrl = new URL(torusUrl);
    if (upbondIframeUrl.pathname.endsWith("/")) upbondIframeUrl.pathname += "popup";
    else upbondIframeUrl.pathname += "/popup";

    upbondIframeUrl.hash = `#isCustomLogin=${this.isCustomLogin}&isRedirect=${isUsingDirect}&dappRedirectUri=${encodeURIComponent(
      `${dappRedirectUri}`
    )}`;

    // Iframe code
    this.upbondIframe = htmlToElement<HTMLIFrameElement>(
      `<iframe
        id="upbondIframe"
        allow=${useWalletConnect ? "camera" : ""}
        class="upbondIframe"
        src="${upbondIframeUrl.href}"
        style="display: none; position: fixed; top: 0; right: 0; width: 100%;
        height: 100%; border: none; border-radius: 0; z-index: ${this.modalZIndex}"
      ></iframe>`
    );

    this.torusAlertContainer = htmlToElement<HTMLDivElement>('<div id="torusAlertContainer"></div>');
    this.torusAlertContainer.style.display = "none";
    this.torusAlertContainer.style.setProperty("z-index", this.alertZIndex.toString());

    const { defaultLanguage = getUserLanguage(), customTranslations = {} } = this.whiteLabel || {};
    const mergedTranslations = deepmerge(configuration.translations, customTranslations);
    const languageTranslations = mergedTranslations[defaultLanguage] || configuration.translations[getUserLanguage()];
    this.embedTranslations = languageTranslations.embed;

    const handleSetup = async () => {
      await documentReady();
      return new Promise((resolve, reject) => {
        this.upbondIframe.onload = async () => {
          // only do this if iframe is not full screen
          await this._setupWeb3();
          const initStream = this.communicationMux.getStream("init_stream") as Substream;
          initStream.on("data", (chunk) => {
            const { name, data, error } = chunk;
            if (name === "init_complete" && data.success) {
              // resolve promise
              this.isInitialized = true;
              this._displayIframe();
              resolve(undefined);
            } else if (error) {
              reject(new Error(error));
            }
          });
          initStream.write({
            name: "init_stream",
            data: {
              enabledVerifiers,
              loginConfig,
              whiteLabel: this.whiteLabel,
              buttonPosition: this.buttonPosition,
              buttonSize: this.buttonSize,
              apiKey: this.apiKey,
              skipTKey,
              network,
              widgetConfig: this.widgetConfig,
              mfaLevel,
              skipDialog,
              selectedVerifier,
              directConfig: {
                enabled: isUsingDirect,
                redirectUrl: dappRedirectUri,
              },
            },
          });
        };
        window.document.body.appendChild(this.upbondIframe);
        window.document.body.appendChild(this.torusAlertContainer);
      });
    };

    if (buildEnv === "production" && integrity.check) {
      // hacky solution to check for iframe integrity
      const fetchUrl = `${torusUrl}/popup`;
      const resp = await fetch(fetchUrl, { cache: "reload" });
      if (resp.headers.get("Cache-Control") !== expectedCacheControlHeader) {
        throw new Error(`Unexpected Cache-Control headers, got ${resp.headers.get("Cache-Control")}`);
      }
      const response = await resp.text();
      const calculatedIntegrity = generateIntegrity(
        {
          algorithms: ["sha384"],
        },
        response
      );
      if (calculatedIntegrity === integrity.hash) {
        await handleSetup();
      } else {
        this.clearInit();
        throw new Error("Integrity check failed");
      }
    } else {
      try {
        await handleSetup();
      } catch (error) {
        console.error(error, "@errorOnInit");
      }
    }
    return undefined;
  }

  login({ verifier = "", login_hint: loginHint = "" }: TorusLoginParams = {}): Promise<string[]> {
    if (!this.isInitialized) throw new Error("Call init() first");
    this.requestedVerifier = verifier;
    this.loginHint = loginHint;
    return this.ethereum.enable();
  }

  logout(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isLoggedIn) {
        reject(new Error("User has not logged in yet"));
        return;
      }

      const logOutStream = this.communicationMux.getStream("logout") as Substream;
      logOutStream.write({ name: "logOut" });
      const statusStream = this.communicationMux.getStream("status") as Substream;
      const statusStreamHandler = (status) => {
        if (!status.loggedIn) {
          this.isLoggedIn = false;
          this.currentVerifier = "";
          this.requestedVerifier = "";
          resolve();
        } else reject(new Error("Some Error Occured"));
      };
      handleStream(statusStream, "data", statusStreamHandler);
    });
  }

  async cleanUp(): Promise<void> {
    if (this.isLoggedIn) {
      await this.logout();
    }
    this.clearInit();
  }

  clearInit(): void {
    function isElement(element: unknown) {
      return element instanceof Element || element instanceof HTMLDocument;
    }
    if (isElement(this.styleLink) && window.document.body.contains(this.styleLink)) {
      this.styleLink.remove();
      this.styleLink = undefined;
    }
    if (isElement(this.upbondIframe) && window.document.body.contains(this.upbondIframe)) {
      this.upbondIframe.remove();
      this.upbondIframe = undefined;
    }
    if (isElement(this.torusAlertContainer) && window.document.body.contains(this.torusAlertContainer)) {
      this.torusAlert = undefined;
      this.torusAlertContainer.remove();
      this.torusAlertContainer = undefined;
    }
    this.isInitialized = false;
  }

  hideWidget(): void {
    this._sendWidgetVisibilityStatus(false);
    this._displayIframe();
  }

  showWidget(): void {
    this._sendWidgetVisibilityStatus(true);
    this._displayIframe();
  }

  showMenu(): void {
    this._sendWidgetMenuVisibilityStatus(true);
    this._displayIframe(true);
  }

  hideMenu(): void {
    this._sendWidgetMenuVisibilityStatus(false);
    this._displayIframe(false);
  }

  setProvider({ host = "mainnet", chainId = null, networkName = "", ...rest }: NetworkInterface): Promise<void> {
    return new Promise((resolve, reject) => {
      const providerChangeStream = this.communicationMux.getStream("provider_change") as Substream;
      const handler = (chunk) => {
        const { err, success } = chunk.data;
        if (err) {
          reject(err);
        } else if (success) {
          resolve();
        } else reject(new Error("some error occured"));
      };
      handleStream(providerChangeStream, "data", handler);
      const preopenInstanceId = getPreopenInstanceId();
      this._handleWindow(preopenInstanceId, {
        target: "_blank",
        features: FEATURES_PROVIDER_CHANGE_WINDOW,
      });
      providerChangeStream.write({
        name: "show_provider_change",
        data: {
          network: {
            host,
            chainId,
            networkName,
            ...rest,
          },
          preopenInstanceId,
          override: false,
        },
      });
    });
  }

  showWallet(path: WALLET_PATH, params: Record<string, string> = {}): void {
    const showWalletStream = this.communicationMux.getStream("show_wallet") as Substream;
    const finalPath = path ? `/${path}` : "";
    showWalletStream.write({ name: "show_wallet", data: { path: finalPath } });

    const showWalletHandler = (chunk) => {
      if (chunk.name === "show_wallet_instance") {
        // Let the error propogate up (hence, no try catch)
        const { instanceId } = chunk.data;
        const finalUrl = new URL(`${this.torusUrl}/wallet${finalPath}`);
        // Using URL constructor to prevent js injection and allow parameter validation.!
        finalUrl.searchParams.append("integrity", "true");
        finalUrl.searchParams.append("instanceId", instanceId);
        Object.keys(params).forEach((x) => {
          finalUrl.searchParams.append(x, params[x]);
        });
        finalUrl.hash = `#isCustomLogin=${this.isCustomLogin}`;
        log.info(`loaded: ${finalUrl}`);
        const walletWindow = new PopupHandler({ url: finalUrl, features: FEATURES_DEFAULT_WALLET_WINDOW });
        walletWindow.open();
      }
    };

    handleStream(showWalletStream, "data", showWalletHandler);
  }

  async getPublicAddress({ verifier, verifierId, isExtended = false }: VerifierArgs): Promise<string | TorusPublicKey> {
    if (!configuration.supportedVerifierList.includes(verifier) || !WALLET_OPENLOGIN_VERIFIER_MAP[verifier]) throw new Error("Unsupported verifier");
    const walletVerifier = verifier;
    const openloginVerifier = WALLET_OPENLOGIN_VERIFIER_MAP[verifier];
    const url = new URL(`https://api.tor.us/lookup/torus`);
    url.searchParams.append("verifier", openloginVerifier);
    url.searchParams.append("verifierId", verifierId);
    url.searchParams.append("walletVerifier", walletVerifier);
    url.searchParams.append("network", "mainnet");
    url.searchParams.append("isExtended", isExtended.toString());
    return get(
      url.href,
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
      { useAPIKey: true }
    );
  }

  getUserInfo(message: string): Promise<UserInfo> {
    return new Promise((resolve, reject) => {
      if (this.isLoggedIn) {
        const userInfoAccessStream = this.communicationMux.getStream("user_info_access") as Substream;
        userInfoAccessStream.write({ name: "user_info_access_request" });
        const userInfoAccessHandler = (chunk) => {
          const {
            name,
            data: { approved, payload, rejected, newRequest },
          } = chunk;
          if (name === "user_info_access_response") {
            if (approved) {
              resolve(payload);
            } else if (rejected) {
              reject(new Error("User rejected the request"));
            } else if (newRequest) {
              const userInfoStream = this.communicationMux.getStream("user_info") as Substream;
              const userInfoHandler = (handlerChunk) => {
                if (handlerChunk.name === "user_info_response") {
                  if (handlerChunk.data.approved) {
                    resolve(handlerChunk.data.payload);
                  } else {
                    reject(new Error("User rejected the request"));
                  }
                }
              };
              handleStream(userInfoStream, "data", userInfoHandler);
              const preopenInstanceId = getPreopenInstanceId();
              this._handleWindow(preopenInstanceId, {
                target: "_blank",
                features: FEATURES_PROVIDER_CHANGE_WINDOW,
              });
              userInfoStream.write({ name: "user_info_request", data: { message, preopenInstanceId } });
            }
          }
        };
        handleStream(userInfoAccessStream, "data", userInfoAccessHandler);
      } else reject(new Error("User has not logged in yet"));
    });
  }

  initiateTopup(provider: PAYMENT_PROVIDER_TYPE, params: PaymentParams): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        const { errors, isValid } = validatePaymentProvider(provider, params);
        if (!isValid) {
          reject(new Error(JSON.stringify(errors)));
          return;
        }
        const topupStream = this.communicationMux.getStream("topup") as Substream;
        const topupHandler = (chunk) => {
          if (chunk.name === "topup_response") {
            if (chunk.data.success) {
              resolve(chunk.data.success);
            } else {
              reject(new Error(chunk.data.error));
            }
          }
        };
        handleStream(topupStream, "data", topupHandler);
        const preopenInstanceId = getPreopenInstanceId();
        this._handleWindow(preopenInstanceId);
        topupStream.write({ name: "topup_request", data: { provider, params, preopenInstanceId } });
      } else reject(new Error("Upbond is not initialized yet"));
    });
  }

  async loginWithPrivateKey(loginParams: { privateKey: string; userInfo: Omit<UserInfo, "isNewUser"> }): Promise<void> {
    const { privateKey, userInfo } = loginParams;
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        if (Buffer.from(privateKey, "hex").length !== 32) {
          reject(new Error("Invalid private key, Please provide a 32 byte valid secp25k1 private key"));
          return;
        }
        const loginPrivKeyStream = this.communicationMux.getStream("login_with_private_key") as Substream;
        const loginHandler = (chunk) => {
          if (chunk.name === "login_with_private_key_response") {
            if (chunk.data.success) {
              resolve(chunk.data.success);
            } else {
              reject(new Error(chunk.data.error));
            }
          }
        };
        handleStream(loginPrivKeyStream, "data", loginHandler);
        loginPrivKeyStream.write({ name: "login_with_private_key_request", data: { privateKey, userInfo } });
      } else reject(new Error("Upbond is not initialized yet"));
    });
  }

  async showWalletConnectScanner(): Promise<void> {
    if (!this.useWalletConnect) throw new Error("Set `useWalletConnect` as true in init function options to use wallet connect scanner");
    return new Promise((resolve, reject) => {
      if (this.isLoggedIn) {
        const walletConnectStream = this.communicationMux.getStream("wallet_connect_stream") as Substream;
        const walletConnectHandler = (chunk) => {
          if (chunk.name === "wallet_connect_stream_res") {
            if (chunk.data.success) {
              resolve(chunk.data.success);
            } else {
              reject(new Error(chunk.data.error));
            }
            this._displayIframe();
          }
        };
        handleStream(walletConnectStream, "data", walletConnectHandler);
        walletConnectStream.write({ name: "wallet_connect_stream_req" });
        this._displayIframe(true);
      } else reject(new Error("User has not logged in yet"));
    });
  }

  protected _handleWindow(preopenInstanceId: string, { url, target, features }: { url?: string; target?: string; features?: string } = {}): void {
    if (preopenInstanceId) {
      const windowStream = this.communicationMux.getStream("window") as Substream;
      const finalUrl = new URL(url || `${this.torusUrl}/redirect?preopenInstanceId=${preopenInstanceId}`);
      if (finalUrl.hash) finalUrl.hash += `&isCustomLogin=${this.isCustomLogin}`;
      else finalUrl.hash = `#isCustomLogin=${this.isCustomLogin}`;

      const handledWindow = new PopupHandler({ url: finalUrl, target, features });
      handledWindow.open();
      if (!handledWindow.window) {
        this._createPopupBlockAlert(preopenInstanceId, finalUrl.href);
        return;
      }
      windowStream.write({
        name: "opened_window",
        data: {
          preopenInstanceId,
        },
      });
      const closeHandler = ({ preopenInstanceId: receivedId, close }) => {
        if (receivedId === preopenInstanceId && close) {
          handledWindow.close();
          windowStream.removeListener("data", closeHandler);
        }
      };
      windowStream.on("data", closeHandler);
      handledWindow.once("close", () => {
        windowStream.write({
          data: {
            preopenInstanceId,
            closed: true,
          },
        });
        windowStream.removeListener("data", closeHandler);
      });
    }
  }

  protected _setEmbedWhiteLabel(element: HTMLElement): void {
    // Set whitelabel
    const { theme } = this.whiteLabel || {};
    if (theme) {
      const { isDark = false, colors = {} } = theme;
      if (isDark) element.classList.add("torus-dark");

      if (colors.torusBrand1) element.style.setProperty("--torus-brand-1", colors.torusBrand1);
      if (colors.torusGray2) element.style.setProperty("--torus-gray-2", colors.torusGray2);
    }
  }

  protected _getLogoUrl(): string {
    let logoUrl = `${this.torusUrl}/images/torus_icon-blue.svg`;
    if (this.whiteLabel?.theme?.isDark) {
      logoUrl = this.whiteLabel?.logoLight || logoUrl;
    } else {
      logoUrl = this.whiteLabel?.logoDark || logoUrl;
    }

    return logoUrl;
  }

  protected _sendWidgetVisibilityStatus(status: boolean): void {
    const upbondButtonVisibilityStream = this.communicationMux.getStream("widget-visibility") as Substream;
    upbondButtonVisibilityStream.write({
      data: status,
    });
  }

  protected _sendWidgetMenuVisibilityStatus(status: boolean): void {
    const upbondButtonVisibilityStream = this.communicationMux.getStream("menu-visibility") as Substream;
    upbondButtonVisibilityStream.write({
      data: status,
    });
  }

  protected _displayIframe(isFull = false): void {
    console.log("onDisplay: ", isFull);
    const style: Partial<CSSStyleDeclaration> = {};
    const size = this.buttonSize + 14; // 15px padding
    // set phase
    if (!isFull) {
      style.display = this.isLoggedIn ? "block" : !this.isLoggedIn ? "block" : "none";
      style.height = `${size}px`;
      style.width = `${size}px`;
      switch (this.buttonPosition) {
        case BUTTON_POSITION.TOP_LEFT:
          style.top = "0px";
          style.left = "0px";
          style.right = "auto";
          style.bottom = "auto";
          break;
        case BUTTON_POSITION.TOP_RIGHT:
          style.top = "0px";
          style.right = "0px";
          style.left = "auto";
          style.bottom = "auto";
          break;
        case BUTTON_POSITION.BOTTOM_RIGHT:
          style.bottom = "0px";
          style.right = "0px";
          style.top = "auto";
          style.left = "auto";
          break;
        case BUTTON_POSITION.BOTTOM_LEFT:
        default:
          style.bottom = "0px";
          style.left = "0px";
          style.top = "auto";
          style.right = "auto";
          break;
      }
    } else {
      style.display = "block";
      style.width = "100%";
      style.height = "100%";
      style.top = "0px";
      style.right = "0px";
      style.left = "0px";
      style.bottom = "0px";
    }
    Object.assign(this.upbondIframe.style, style);
    this.isIframeFullScreen = isFull;
  }

  protected async _setupWeb3(): Promise<void> {
    // setup background connection
    const metamaskStream = new BasePostMessageStream({
      name: "embed_metamask",
      target: "iframe_metamask",
      targetWindow: this.upbondIframe.contentWindow,
      targetOrigin: new URL(this.torusUrl).origin,
    });

    // Due to compatibility reasons, we should not set up multiplexing on window.metamaskstream
    // because the MetamaskInpageProvider also attempts to do so.
    // We create another LocalMessageDuplexStream for communication between dapp <> iframe
    const communicationStream = new BasePostMessageStream({
      name: "embed_comm",
      target: "iframe_comm",
      targetWindow: this.upbondIframe.contentWindow,
      targetOrigin: new URL(this.torusUrl).origin,
    });

    // Backward compatibility with Gotchi :)
    // window.metamaskStream = this.communicationStream

    // compose the inpage provider
    const inpageProvider = new UpbondInpageProvider(metamaskStream);

    // detect eth_requestAccounts and pipe to enable for now
    const detectAccountRequestPrototypeModifier = (m) => {
      const originalMethod = inpageProvider[m];
      inpageProvider[m] = function providerFunc(method, ...args) {
        if (method && method === "eth_requestAccounts") {
          return inpageProvider.enable();
        }
        return originalMethod.apply(this, [method, ...args]);
      };
    };

    detectAccountRequestPrototypeModifier("send");
    detectAccountRequestPrototypeModifier("sendAsync");

    inpageProvider.enable = () => {
      return new Promise((resolve, reject) => {
        // If user is already logged in, we assume they have given access to the website
        inpageProvider.sendAsync({ jsonrpc: "2.0", id: getPreopenInstanceId(), method: "eth_requestAccounts", params: [] }, (err, response) => {
          const { result: res } = (response as { result: unknown }) || {};
          if (err) {
            setTimeout(() => {
              reject(err);
            }, 50);
          } else if (Array.isArray(res) && res.length > 0) {
            // If user is already rehydrated, resolve this
            // else wait for something to be written to status stream
            const handleLoginCb = () => {
              if (this.requestedVerifier !== "" && this.currentVerifier !== this.requestedVerifier) {
                const { requestedVerifier } = this;
                // eslint-disable-next-line promise/no-promise-in-callback
                this.logout()
                  // eslint-disable-next-line promise/always-return
                  .then((_) => {
                    this.requestedVerifier = requestedVerifier;
                    this._showLoginPopup(true, resolve, reject);
                  })
                  .catch((error) => reject(error));
              } else {
                resolve(res);
              }
            };
            if (this.isLoggedIn) {
              handleLoginCb();
            } else {
              this.isLoginCallback = handleLoginCb;
            }
          } else {
            // set up listener for login
            this._showLoginPopup(true, resolve, reject, this.skipDialog);
          }
        });
      });
    };

    inpageProvider.tryPreopenHandle = (payload: UnvalidatedJsonRpcRequest | UnvalidatedJsonRpcRequest[], cb: (...args: unknown[]) => void) => {
      const _payload = payload;
      if (this.buildEnv.includes("v1")) {
        if (!Array.isArray(_payload) && UNSAFE_METHODS.includes(_payload.method)) {
          const preopenInstanceId = getPreopenInstanceId();
          this._handleWindow(preopenInstanceId, {
            target: "_blank",
            features: FEATURES_CONFIRM_WINDOW,
          });
          _payload.preopenInstanceId = preopenInstanceId;
        }
      }
      inpageProvider._rpcEngine.handle(_payload as JRPCRequest<unknown>[], cb);
    };

    // Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
    // `sendAsync` method on the prototype, causing `this` reference issues with drizzle
    const proxiedInpageProvider = new Proxy(inpageProvider, {
      // straight up lie that we deleted the property so that it doesnt
      // throw an error in strict mode
      deleteProperty: () => true,
    });

    this.ethereum = proxiedInpageProvider;
    const communicationMux = setupMultiplex(communicationStream);

    this.communicationMux = communicationMux;

    const windowStream = communicationMux.getStream("window") as Substream;
    windowStream.on("data", (chunk) => {
      if (chunk.name === "create_window") {
        // url is the url we need to open
        // we can pass the final url upfront so that it removes the step of redirecting to /redirect and waiting for finalUrl
        this._createPopupBlockAlert(chunk.data.preopenInstanceId, chunk.data.url);
      }
    });

    // show torus widget if button clicked
    const widgetStream = communicationMux.getStream("widget") as Substream;
    widgetStream.on("data", async (chunk) => {
      const { data } = chunk;
      this._displayIframe(data);
    });

    // Show torus button if wallet has been hydrated/detected
    const statusStream = communicationMux.getStream("status") as Substream;
    statusStream.on("data", (status) => {
      // login
      if (status.loggedIn) {
        this.isLoggedIn = status.loggedIn;
        this.currentVerifier = status.verifier;
      } // logout
      else this._displayIframe();
      if (this.isLoginCallback) {
        this.isLoginCallback();
        delete this.isLoginCallback;
      }
    });

    this.provider = proxiedInpageProvider;

    if (this.provider.shouldSendMetadata) sendSiteMetadata(this.provider._rpcEngine);
    inpageProvider._initializeState();
    if (window.location.search) {
      // taro buat send stream address disini:

      const data = searchToObject<{
        loggedIn: string;
        rehydrate: string;
        selectedAddress: string;
        verifier: string;
        state: string;
      }>(window.location.search);

      const oauthStream = this.communicationMux.getStream("oauth") as Substream;
      const isLoggedIn = data.loggedIn === "true";
      const isRehydrate = data.rehydrate === "true";
      let state = "";

      if (data.state) {
        state = data.state;
      }

      const { selectedAddress, verifier } = data;
      if (isLoggedIn) {
        this.isLoggedIn = true;
        this.currentVerifier = verifier;
      } else this._displayIframe(true);

      this._displayIframe(true);

      oauthStream.write({ selectedAddress });
      statusStream.write({ loggedIn: isLoggedIn, rehydrate: isRehydrate, verifier, state });

      await inpageProvider._initializeState();

      window.history.replaceState(null, "", window.location.origin + window.location.pathname);
    }
  }

  protected _showLoginPopup(calledFromEmbed: boolean, resolve: (a: string[]) => void, reject: (err: Error) => void, skipDialog = false): void {
    const loginHandler = async (data) => {
      const { err, selectedAddress } = data;
      if (err) {
        log.error(err);
        if (reject) reject(err);
      }
      // returns an array (cause accounts expects it)
      else if (resolve) resolve([selectedAddress]);
      if (this.isIframeFullScreen) this._displayIframe(false);
    };
    const oauthStream = this.communicationMux.getStream("oauth") as Substream;
    if (!this.requestedVerifier) {
      this._displayIframe(true);
      handleStream(oauthStream, "data", loginHandler);
      oauthStream.write({
        name: "oauth_modal",
        data: {
          calledFromEmbed,
          skipDialog,
          isUsingDirect: this.isUsingDirect,
          verifier: this.currentVerifier,
          dappRedirectUrl: this.dappRedirectUrl,
          selectedVerifier: this.selectedVerifier,
        },
      });
    } else {
      handleStream(oauthStream, "data", loginHandler);
      const preopenInstanceId = getPreopenInstanceId();
      this._handleWindow(preopenInstanceId);
      oauthStream.write({
        name: "oauth",
        data: {
          calledFromEmbed,
          verifier: this.requestedVerifier,
          preopenInstanceId,
          login_hint: this.loginHint,
          skipDialog,
          selectedVerifier: this.selectedVerifier,
        },
      });
    }
  }

  protected _createPopupBlockAlert(preopenInstanceId: string, url: string): void {
    const logoUrl = this._getLogoUrl();
    const torusAlert = htmlToElement<HTMLDivElement>(
      '<div id="torusAlert" class="torus-alert--v2">' +
        `<div id="torusAlert__logo"><img src="${logoUrl}" /></div>` +
        "<div>" +
        `<h1 id="torusAlert__title">${this.embedTranslations.actionRequired}</h1>` +
        `<p id="torusAlert__desc">${this.embedTranslations.pendingAction}</p>` +
        "</div>" +
        "</div>"
    );

    const successAlert = htmlToElement(`<div><a id="torusAlert__btn">${this.embedTranslations.continue}</a></div>`);
    const btnContainer = htmlToElement('<div id="torusAlert__btn-container"></div>');
    btnContainer.appendChild(successAlert);
    torusAlert.appendChild(btnContainer);
    const bindOnLoad = () => {
      successAlert.addEventListener("click", () => {
        this._handleWindow(preopenInstanceId, {
          url,
          target: "_blank",
          features: FEATURES_CONFIRM_WINDOW,
        });
        torusAlert.remove();

        if (this.torusAlertContainer.children.length === 0) this.torusAlertContainer.style.display = "none";
      });
    };

    this._setEmbedWhiteLabel(torusAlert);

    const attachOnLoad = () => {
      this.torusAlertContainer.style.display = "block";
      this.torusAlertContainer.appendChild(torusAlert);
    };

    runOnLoad(attachOnLoad);
    runOnLoad(bindOnLoad);
  }
}

export default Upbond;

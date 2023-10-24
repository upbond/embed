// import { get } from "@toruslabs/http-helpers";
import { JRPCMiddleware, PendingJRPCResponse, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { ethErrors } from "eth-rpc-errors";
import { LogLevelDesc } from "loglevel";

import config from "./config";
import {
  IntegrityParams,
  LoginConfig,
  LoginConfigItem,
  PAYMENT_PROVIDER,
  PAYMENT_PROVIDER_TYPE,
  PaymentParams,
  UPBOND_BUILD_ENV_TYPE,
} from "./interfaces";
import log from "./loglevel";

const { paymentProviders } = config;

type PaymentErrorParams = {
  fiatValue?: string;
  selectedCurrency?: string;
  selectedCryptoCurrency?: string;
};

type PaymentErrors = { provider?: string } & PaymentErrorParams;

export const defaultLoginParam = {
  "upbond-line": {
    name: "LINE",
    description: "LINE",
    typeOfLogin: "line",
    loginProvider: "upbond-line",
    jwtParameters: {
      domain: "https://lzg2dndj.auth.dev.upbond.io",
      connection: "line",
      clientId: "FoQ_Ri8rKSXkHf82GRzZK",
      scope: "openid email profile offline_access",
    },
    clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 1,
    customLogo: "line",
    logo: "https://elvira.co.th/wp-content/uploads/2016/02/line-icon.png",
    buttonBgColor: "#289B2A",
    buttonTextColor: "#f3f3f3",
  } as LoginConfigItem,
  "upbond-google": {
    name: "Google",
    description: "Google",
    typeOfLogin: "jwt",
    loginProvider: "upbond-google",
    jwtParameters: {
      domain: "https://lzg2dndj.auth.dev.upbond.io",
      connection: "line",
      clientId: "hxFv4SaQVXv3tE_rhe5u9",
      scope: "openid email profile offline_access",
    },
    clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 2,
    customLogo: "google",
    logo: "https://www.seekpng.com/png/full/788-7887426_google-g-png-google-logo-white-png.png",
    buttonBgColor: "#4B68AE",
    buttonTextColor: "#FFF",
  } as LoginConfigItem,
} as LoginConfig;

export const defaultLoginParamStg = {
  "upbond-line": {
    name: "LINE",
    description: "LINE",
    typeOfLogin: "line",
    loginProvider: "upbond-line",
    jwtParameters: {
      domain: "https://6a8e4595.auth.stg.upbond.io",
      connection: "line",
      clientId: "YQvxSsSNOIFgoEwZoiPdm",
      scope: "openid email profile offline_access",
    },
    clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 1,
    customLogo: "line",
    logo: "https://elvira.co.th/wp-content/uploads/2016/02/line-icon.png",
    buttonBgColor: "#289B2A",
    buttonTextColor: "#f3f3f3",
  } as LoginConfigItem,
  "upbond-google": {
    name: "Google",
    description: "Google",
    typeOfLogin: "jwt",
    loginProvider: "upbond-google",
    jwtParameters: {
      domain: "https://6a8e4595.auth.stg.upbond.io",
      connection: "line",
      clientId: "zYvDxb22eVYLqDMAp_ql9",
      scope: "openid email profile offline_access",
    },
    clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 2,
    customLogo: "google",
    logo: "https://www.seekpng.com/png/full/788-7887426_google-g-png-google-logo-white-png.png",
    buttonBgColor: "#4B68AE",
    buttonTextColor: "#FFF",
  } as LoginConfigItem,
} as LoginConfig;

export const defaultLoginParamProd = {
  "upbond-line": {
    name: "LINE",
    description: "LINE",
    typeOfLogin: "line",
    loginProvider: "upbond-line",
    jwtParameters: {
      domain: "https://auth.upbond.io",
      connection: "line",
      clientId: "wa3wjaB0dx0RO9AgzngM-",
      scope: "openid email profile offline_access",
    },
    clientId: "BKmNTSQ7y8yWyhNT_W5BobaAu7Re-zLW6fzK0bzdvjP9a-G4OP8ajriQJHFOH3ypvRIJeEp_O40aag-7iNTyp-s",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 1,
    customLogo: "line",
    logo: "https://elvira.co.th/wp-content/uploads/2016/02/line-icon.png",
    buttonBgColor: "#289B2A",
    buttonTextColor: "#f3f3f3",
  } as LoginConfigItem,
  "upbond-google": {
    name: "Google",
    description: "Google",
    typeOfLogin: "jwt",
    loginProvider: "upbond-google",
    jwtParameters: {
      domain: "https://auth.upbond.io",
      connection: "line",
      clientId: "hxFv4SaQVXv3tE_rhe5u9",
      scope: "openid email profile offline_access",
    },
    clientId: "BKmNTSQ7y8yWyhNT_W5BobaAu7Re-zLW6fzK0bzdvjP9a-G4OP8ajriQJHFOH3ypvRIJeEp_O40aag-7iNTyp-s",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 2,
    customLogo: "google",
    logo: "https://www.seekpng.com/png/full/788-7887426_google-g-png-google-logo-white-png.png",
    buttonBgColor: "#4B68AE",
    buttonTextColor: "#FFF",
  } as LoginConfigItem,
} as LoginConfig;

export const validatePaymentProvider = (provider: string, params: PaymentParams): { errors: PaymentErrors; isValid: boolean } => {
  const errors: PaymentErrors = {};

  if (!provider) {
    return { errors, isValid: true };
  }

  if (provider && !paymentProviders[provider]) {
    errors.provider = "Invalid Provider";
    return { errors, isValid: Object.keys(errors).length === 0 };
  }

  const selectedProvider = paymentProviders[provider as PAYMENT_PROVIDER_TYPE];
  const selectedParams = params || {};

  // set default values
  // if (!selectedParams.selectedCurrency) [selectedParams.selectedCurrency] = selectedProvider.validCurrencies
  // if (!selectedParams.fiatValue) selectedParams.fiatValue = selectedProvider.minOrderValue
  // if (!selectedParams.selectedCryptoCurrency) [selectedParams.selectedCryptoCurrency] = selectedProvider.validCryptoCurrencies

  // validations
  if (selectedParams.fiatValue) {
    const requestedOrderAmount = +parseFloat(selectedParams.fiatValue.toString()) || 0;
    if (requestedOrderAmount < selectedProvider.minOrderValue) errors.fiatValue = "Requested amount is lower than supported";
    if (requestedOrderAmount > selectedProvider.maxOrderValue && selectedProvider.enforceMax)
      errors.fiatValue = "Requested amount is higher than supported";
  }
  if (selectedParams.selectedCurrency && !selectedProvider.validCurrencies.includes(selectedParams.selectedCurrency)) {
    errors.selectedCurrency = "Unsupported currency";
  }
  if (selectedParams.selectedCryptoCurrency) {
    const validCryptoCurrenciesByChain = Object.values(selectedProvider.validCryptoCurrenciesByChain)
      .flat()
      .map((currency) => currency.value);

    const finalCryptoCurrency =
      provider === PAYMENT_PROVIDER.MOONPAY ? selectedParams.selectedCryptoCurrency.toLowerCase() : selectedParams.selectedCryptoCurrency;

    if (validCryptoCurrenciesByChain && !validCryptoCurrenciesByChain.includes(finalCryptoCurrency))
      errors.selectedCryptoCurrency = "Unsupported cryptoCurrency";
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};

// utility functions

/**
 * json-rpc-engine middleware that logs RPC errors and and validates req.method.
 *
 * @param log - The logging API to use.
 * @returns  json-rpc-engine middleware function
 */
export function createErrorMiddleware(): JRPCMiddleware<unknown, unknown> {
  return (req, res, next) => {
    // json-rpc-engine will terminate the request when it notices this error
    if (typeof req.method !== "string" || !req.method) {
      res.error = ethErrors.rpc.invalidRequest({
        message: `The request 'method' must be a non-empty string.`,
        data: req,
      });
    }

    next((done) => {
      const { error } = res;
      if (!error) {
        return done();
      }
      log.error(`MetaMask - RPC Error: ${error.message}`, error);
      return done();
    });
  };
}

// resolve response.result or response, reject errors
export const getRpcPromiseCallback =
  (resolve: (value?: any) => void, reject: (error?: Error) => void, unwrapResult = true) =>
  (error: Error, response: PendingJRPCResponse<unknown>): void => {
    if (error || response.error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reject(error || response.error);
    } else {
      resolve(!unwrapResult || Array.isArray(response) ? response : response.result);
    }
  };

/**
 * Logs a stream disconnection error. Emits an 'error' if given an
 * EventEmitter that has listeners for the 'error' event.
 *
 * @param log - The logging API to use.
 * @param remoteLabel - The label of the disconnected stream.
 * @param error - The associated error to log.
 * @param emitter - The logging API to use.
 */
export function logStreamDisconnectWarning(remoteLabel: string, error: Error, emitter: SafeEventEmitter): void {
  let warningMsg = `MetaMask: Lost connection to "${remoteLabel}".`;
  if (error?.stack) {
    warningMsg += `\n${error.stack}`;
  }
  log.warn(warningMsg);
  if (emitter && emitter.listenerCount("error") > 0) {
    emitter.emit("error", warningMsg);
  }
}

export const getPreopenInstanceId = () => Math.random().toString(36).slice(2);

export const getUpbondWalletUrl = async (
  buildEnv: UPBOND_BUILD_ENV_TYPE,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  integrity: IntegrityParams
): Promise<{ torusUrl: string; logLevel: LogLevelDesc }> => {
  log.info("Opening torus URL!");
  let torusUrl: string;
  let logLevel: LogLevelDesc;
  // log.info("version used: ", versionUsed);
  switch (buildEnv) {
    /*
    Default the default to v2
    */
    case "production":
    case "v1_production":
    case "v2_production":
      torusUrl = `https://wallet.upbond.io`;
      logLevel = "info";
      break;
    case "staging":
      torusUrl = "https://wallet.stg.upbond.io";
      logLevel = "info";
      break;
    case "v1_staging":
    case "v2_staging":
      torusUrl = "https://login.stg.upbond.io";
      logLevel = "info";
      break;
    case "development":
      torusUrl = "https://new-wallet-mobile.dev.upbond.io";
      logLevel = "info";
      break;
    case "v1_development":
    case "v2_development":
    case "testing":
      torusUrl = "https:/login.dev.upbond.io";
      logLevel = "debug";
      break;
    case "local":
    case "v2_local":
      torusUrl = "http://localhost:3002";
      logLevel = "debug";
      break;
    case "wallet-did":
      torusUrl = "https://wallet-did.dev.upbond.io";
      logLevel = "debug";
      break;
    default:
      torusUrl = `https://wallet.upbond.io`;
      logLevel = "info";
      break;
  }
  return { torusUrl, logLevel };
};

export const getUserLanguage = (): string => {
  let userLanguage = window.navigator.language || "en-US";
  const userLanguages = userLanguage.split("-");
  userLanguage = Object.prototype.hasOwnProperty.call(config.translations, userLanguages[0]) ? userLanguages[0] : "en";
  return userLanguage;
};

export const EMITTED_NOTIFICATIONS = [
  "eth_subscription", // per eth-json-rpc-filters/subscriptionManager
];

export const NOOP = (): void => {
  // empty function
};

export const FEATURES_PROVIDER_CHANGE_WINDOW = "directories=0,titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=660,width=375";
export const FEATURES_DEFAULT_WALLET_WINDOW = "directories=0,titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=740,width=1315";
export const FEATURES_DEFAULT_POPUP_WINDOW = "directories=0,titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=700,width=1200";
export const FEATURES_CONFIRM_WINDOW = "directories=0,titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=700,width=450";

export function getPopupFeatures(): string {
  // Fixes dual-screen position                             Most browsers      Firefox
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const w = 1200;
  const h = 700;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : window.screen.width;

  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : window.screen.height;

  const systemZoom = 1; // No reliable estimate

  const left = Math.abs((width - w) / 2 / systemZoom + dualScreenLeft);
  const top = Math.abs((height - h) / 2 / systemZoom + dualScreenTop);
  const features = `titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=${h / systemZoom},width=${w / systemZoom},top=${top},left=${left}`;
  return features;
}

export const searchToObject = <T>(search): T => {
  return search
    .substring(1)
    .split("&")
    .reduce(function (result, value) {
      const parts = value.split("=");
      if (parts[0]) result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      return result as T;
    }, {});
};

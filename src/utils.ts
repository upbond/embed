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
  "upbond-wallet-tesnet-line": {
    name: "Upbond",
    description: "LINE with UPBOND Identity",
    typeOfLogin: "line",
    jwtParams: {
      domain: "https://lzg2dndj.auth.dev.upbond.io",
      connection: "line",
      clientId: "FoQ_Ri8rKSXkHf82GRzZK",
      scope: "openid email profile offline_access",
      // redirect_uri: "http://localhost:3000/auth",
    },
    clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
    logoHover: "",
    logoLight: "https://app.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
    logoDark: "https://app.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    priority: 1,
  } as LoginConfigItem,
  jwt: {
    loginProvider: "jwt",
    verifier: "upbond-google-dev-tesnet",
    typeOfLogin: "jwt",
    name: "google",
    description: "",
    clientId: "hxFv4SaQVXv3tE_rhe5u9",
    verifierSubIdentifier: "torus",
    logoHover: "",
    logoLight: "",
    logoDark: "",
    showOnModal: false,
    mainOption: false,
    showOnDesktop: false,
    showOnMobile: false,
    // For torus only
    buttonDescription: "",
    walletVerifier: "upbond-google-dev-tesnet",
    jwtParameters: {
      domain: "https://lzg2dndj.auth.dev.upbond.io/",
      connection: "google",
      clientId: "hxFv4SaQVXv3tE_rhe5u9",
      redirect_uri: "http://localhost:3002/auth",
    },
    customLogo: "google",
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
    case "production":
      torusUrl = `https://wallet.upbond.io`;
      logLevel = "info";
      break;
    case "testing":
      torusUrl = "https://wallet-mobile.dev.upbond.io";
      logLevel = "debug";
      break;
    case "development":
      torusUrl = "http://localhost:3002";
      logLevel = "debug";
      break;
    case "new-dev-local":
      torusUrl = "http://localhost:3000";
      logLevel = "debug";
      break;
    case "staging":
      torusUrl = "https://wallet.stg.upbond.io";
      logLevel = "info";
      break;
    case "direct-test":
      torusUrl = "https://wallet-embed-trial.dev.upbond.io";
      logLevel = "debug";
      break;
    case "v2_development":
      torusUrl = "https://new-wallet-dbg-dwi.dev.upbond.io";
      logLevel = "debug";
      break;
    case "v2_new-dev-local":
      torusUrl = "http://localhost:3000";
      logLevel = "debug";
      break;
    case "v2_local":
      torusUrl = "http://localhost:3002";
      logLevel = "debug";
      break;
    case "v2_staging":
      torusUrl = "https://wallet.stg.upbond.io"; // TODO: change stag url to v2 stag url
      logLevel = "info";
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

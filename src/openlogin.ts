import OpenLogin from "@toruslabs/openlogin";
import { WhiteLabelData } from "@toruslabs/openlogin-jrpc";

let openLoginInstance = null;

export async function getOpenLoginInstance(whiteLabel: WhiteLabelData = {}, loginConfig = {}) {
  const whiteLabelOpenLogin = {} as WhiteLabelData;
  if (openLoginInstance !== null) {
    return openLoginInstance;
  }
  if (whiteLabel.theme) {
    if (whiteLabel.theme.isDark) whiteLabelOpenLogin.dark = true;
  }
  if (whiteLabel.logoDark) whiteLabelOpenLogin.logoDark = whiteLabel.logoDark;
  if (whiteLabel.logoLight) whiteLabelOpenLogin.logoLight = whiteLabel.logoLight;
  if (whiteLabel.defaultLanguage) whiteLabelOpenLogin.defaultLanguage = whiteLabel.defaultLanguage;
  const openLogin = new OpenLogin({
    clientId: `BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU`,
    _iframeUrl: `http://localhost:3002`,
    redirectUrl: `${window.location.origin}`,
    replaceUrlOnRedirect: true,
    uxMode: "redirect",
    network: "testnet",
    whiteLabel: whiteLabelOpenLogin,
    loginConfig,
    // no3PC: true,
  });

  await openLogin.init();
  // eslint-disable-next-line require-atomic-updates
  openLoginInstance = openLogin;
  return openLoginInstance;
}

export { default } from "@toruslabs/openlogin";

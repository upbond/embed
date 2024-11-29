import { Injectable } from "@angular/core";
import Upbond from "@upbond/upbond-embed";
import { ethers } from "ethers";
import { environment } from "src/environments/environment";
import Web3 from "web3";
import Web3Token from "web3-token";

@Injectable({
  providedIn: "root",
})
export class UpbondService {
  network = {
    host: "mumbai",
    chainId: 80001,
    networkName: "mumbai",
    blockExplorer: "https://mumbai.polygonscan.com/",
    ticker: "MUMBAI",
    tickerName: "MUMBAI",
    rpcUrl: "https://polygon-mumbai.infura.io/v3/74a97bae118345ecbadadaaeb1cf4a53",
  };
  upbond: any = null;
  web3: any = null;
  provider: any = null;
  isLoggedIn = false;
  initialized = false;

  constructor() {
    this.upbond = new Upbond({
      consentConfiguration: {
        clientId: "576a597e28be9015b6e522040eeede2ad5ffd4edc1a2df55e04a6a8672e7865f",
        secretKey: "8c1817ee29b508e0e5271379a582cc66",
        scope: ["email", "name", "birthday"],
      },
      enableConsent: true,
    });
    this.web3 = new Web3();
    this.provider = null;
  }

  async init() {
    if (this.upbond instanceof Upbond) {
      await this.upbond.init({
        buildEnv: (environment.buildEnv as any) || "development",
        network: this.network,
        widgetConfig: {
          showAfterLoggedIn: true,
          showBeforeLoggedIn: false,
        },
        whiteLabel: {
          walletTheme: {
            lang: (`${window.navigator.language}` as any) || "ja",
            logo: "https://embed-sample.dev.upbond.io/static/media/company-logo-sample.614a5e0665c7df202dbf.png",
            name: "Company",
            buttonLogo: "https://i.ibb.co/wBmybLc/company-button-logo-sample.png",
            isActive: true,
            modalColor: "#fffff",
            bgColor: "#4B68AE",
            bgColorHover: "#214999",
            textColor: "#f3f3f3",
            textColorHover: "#214999",
            upbondLogin: {
              globalBgColor: "#ffffff",
              globalTextColor: "#4B68AE",
            },
            consentConfiguration: {
              clientId: "576a597e28be9015b6e522040eeede2ad5ffd4edc1a2df55e04a6a8672e7865f",
              secretKey: "8c1817ee29b508e0e5271379a582cc66",
              scope: ["email", "name", "birthday"],
            },
            enableConsent: true,
          } as any,
        },
      });
      console.log("UPBOND Embed initialized!");
    }
  }

  async login() {
    try {
      if (this.upbond instanceof Upbond && this.web3 instanceof Web3) {
        const _provider = await this.upbond.login(); // login using upbond
        this.web3.setProvider(this.upbond.provider);

        const accounts = await this.web3.eth.getAccounts();

        this.isLoggedIn = true;
        this.provider = _provider;
        return {
          msg: "success",
          data: _provider,
          accounts,
          // ... anything that you want to returns
        };
      }
    } catch (error: any) {
      console.log(error, "@errorOnReactProject?");
      return {
        msg: error.message || "Failed to login",
        data: null,
      };
    }
    return null;
  }

  async logout() {
    try {
      if (this.upbond instanceof Upbond) {
        await this.upbond.logout();
        await this.upbond.cleanUp();
        window.location.reload();

        return {
          msg: "success",
          data: true,
        };
      }
    } catch (error: any) {
      return {
        msg: error.message || "Failed to login",
        data: null,
      };
    }
    return null;
  }

  async getUserInfo() {
    if (this.upbond instanceof Upbond) {
      try {
        const userInfo = await this.upbond.getUserInfo();
        return userInfo;
      } catch (error: any) {
        throw new Error(error);
      }
    }
    return null;
  }

  async signTransaction(msg = "", account: any) {
    if (this.web3 instanceof Web3) {
      try {
        this.web3.setProvider(this.upbond.provider);
        const sign = await this.web3.eth.sign(msg, account);
        return sign;
      } catch (error: any) {
        console.error(error);
        throw new Error(error);
      }
    }
    return null;
  }

  async signWeb3Token(account: any) {
    try {
      const ether = new ethers.BrowserProvider(this.upbond.provider);
      const signer = await ether.getSigner();
      const sign = await Web3Token.sign(
        async (msg: any) => {
          if (this.web3 instanceof Web3) {
            return await signer.signMessage(msg);
          }
          return null;
        },
        {
          expires_in: "3 days",
          expiration_time: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
          nonce: Math.ceil(Math.random() * 10),
        }
      );
      return sign;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}

import Upbond from "@upbond/upbond-embed";
import Web3 from "web3";
import Web3Token from "web3-token";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

class UpbondEmbed {
  // Initials
  upbond = null;

  web3 = null;

  // you can also use another envs.
  env = `${process.env.REACT_APP_EMBED_BUILD_ENV || "production"}`; // may be development | staging | production

  provider;

  isLoggedIn = false;

  initialized = false;

  constructor() {
    this.upbond = new Upbond({});
    this.web3 = new Web3();
    this.provider = null;
  }

  async init() {
    if (this.upbond instanceof Upbond) {
      await this.upbond.init({
        buildEnv: this.env,
        whiteLabel: {
          walletTheme: {
            logo: "https://i.ibb.co/L6vHB5d/company-logo-sample.png",
            name: "Company",
            buttonLogo:
              "https://i.ibb.co/wBmybLc/company-button-logo-sample.png",
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
          },
        },
      });
      console.log('UPBOND Embed initialized!')
      this.initialized = true;
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
    } catch (error) {
      console.log(error, "@errorOnReactProject?");
      toast.error(error.message || "Some error occured");
      return {
        msg: error.message || "Failed to login",
        data: null,
      };
    }
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
    } catch (error) {
      toast.error(error.message || "Some error occured");
      return {
        msg: error.message || "Failed to login",
        data: null,
      };
    }
  }

  async getUserInfo() {
    if (this.upbond instanceof Upbond) {
      try {
        const userInfo = await this.upbond.getUserInfo();
        return userInfo;
      } catch (error) {
        toast.error(error.message || "Some error occured");
        throw new Error(error);
      }
    }
  }

  async signTransaction(msg = "", account) {
    if (this.web3 instanceof Web3) {
      try {
        this.web3.setProvider(this.upbond.provider);
        const sign = await this.web3.eth.sign(msg, account);
        return sign;
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Some error occured");
        return null;
      }
    }
  }
  async signWeb3Token(account) {
    try {
      const ether = new ethers.providers.Web3Provider(this.upbond.provider);
      const signer = await ether.getSigner();
      const sign = await Web3Token.sign(async (msg) => {
        if (this.web3 instanceof Web3) {
          return await signer.signMessage(msg);
        }
      }, "1d");
      return sign;
    } catch (error) {
      toast.error(error.message || "Some error occured");
      return;
    }
  }
}

const upbondServices = new UpbondEmbed();

export default upbondServices;

import Upbond from "@upbond/upbond-embed";
import Web3 from "web3";
import Web3Token from "web3-token";
import { ethers } from "ethers";

class UpbondEmbed {
  // Initials
  upbond = null;

  web3 = null;

  provider = null;

  isLoggedIn = false;

  initialized = false;

  whiteLabel = {
    walletTheme: {
      lang: "en",
      logo: "https://i.ibb.co/L6vHB5d/company-logo-sample.png",
      name: "Company",
      buttonLogo: "https://auth-service-public.s3.ap-northeast-1.amazonaws.com/assets/sample-button-logo.png",
      isActive: true,
      modalColor: "#fffff",
      bgColor: "#4B68AE",
      bgColorHover: "#214999",
      textColor: "#f3f3f3",
      textColorHover: "#214999",
      upbondLogin: {
        globalBgColor: "#ffffff",
        globalTextColor: "#4B68AE"
      }
    }
  }

  networks = {
    host: "amoy",
    chainId: 80002,
    networkName: "amoy",
    blockExplorer: "https://amoy.polygonscan.com/",
    ticker: "AMOY",
    tickerName: "AMOY",
    rpcUrl: "https://polygon-amoy.drpc.org"
  };

  constructor() {
    this.upbond = new Upbond({});
    this.web3 = new Web3();
    this.provider = null;
    this.idToken = null;
  }

  async init({ idToken }) {
    if (this.upbond instanceof Upbond) {
      await this.upbond.init({
        state: idToken,
        network: this.networks,
        whiteLabel: this.whiteLabel,
        widgetConfig: {
          showAfterLoggedIn: false,
          showBeforeLoggedIn: false
        }
      });
      console.log("UPBOND Embed initialized!");
      this.initialized = true;
      this.provider = upbondServices.upbond.provider;
      this.web3.setProvider(this.upbond.provider);
    }
  }

  async signTransaction(msg = "", account) {
    if (this.web3 instanceof Web3) {
      try {
        console.log("@this.upbond.provider", this.upbond.provider);
        this.web3.setProvider(this.upbond.provider);
        const sign = await this.web3.eth.sign(msg, account);
        return sign;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  }

  async signWeb3Token(account) {
    try {
      const ether = new ethers.providers.Web3Provider(this.upbond.provider);
      const signer = await ether.getSigner();
      const sign = await Web3Token.sign(
        async (msg) => {
          if (this.web3 instanceof Web3) {
            return await signer.signMessage(msg, account);
          }
        },
        {
          expires_in: "3 days",
          expiration_time: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
          nonce: Math.ceil(Math.random() * 10)
        }
      );
      return sign;
    } catch (error) {
      console.error(error.message || "Some error occured");
      return;
    }
  }

  async sendTransaction(data) {
    try {
      const provider = new ethers.providers.Web3Provider(this.upbond.provider);
      const signer = provider.getSigner();
      const gasPrice = await provider.getGasPrice();
      const tx = {
        to: data.to,
        // Convert currency unit from ether to wei
        value: ethers.utils.parseEther("0.0001").toString(),
        gasLimit: 30000,
        gasPrice,
      };
      // Send a transaction
      signer
        .sendTransaction(tx)
        .then((txObj) => {
          console.log("txHash", txObj);
          // setTxResult({ hash: txObj.hash });
          // => 0x9c172314a693b94853b49dc057cf1cb8e529f29ce0272f451eea8f5741aa9b58
          // A transaction result can be checked in a etherscan with a transaction hash which can be obtained here.
        })
        .catch((err) => {
          if ( err?.data?.code == "-32000") console.error("Insufficient Balance")
          console.log("@err", err)
      });

    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getAccounts() {
    this.web3.setProvider(this.upbond.provider);
    const accounts = await this.web3.eth.getAccounts();
    console.log("@accounts", accounts);
    return accounts[0];
  }
}

const upbondServices = new UpbondEmbed();

export default upbondServices;

import Upbond from "./upbond-embed/upbondEmbed.esm";
import Web3 from "web3";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import Web3Token from "web3-token";

class UpbondEmbed {

  // Initials
  upbond = null

  web3 = null

  // you can also using another envs.
  env = "development"
  
  provider

  isLoggedIn = false

  initialized = false

  constructor() {
    this.upbond = new Upbond({})
    this.web3 = new Web3()
    this.provider = null
  }

  async init() {
    if (this.upbond instanceof Upbond) {
      await this.upbond.init({
        buildEnv: this.env,
        isUsingDirect: true,
        skipDialog: false,
        dappRedirectUri: `${window.location.origin}/sapi`,
        selectedVerifier: 'upbond-wallet-tesnet-line',
        loginConfig: {
          jwt: {
            name: 'Google Login',
            typeOfLogin: 'jwt',
            showOnModal: true,
            clientId: "<your_client_id>",
            showOnDesktop: true,
            showOnMobile: true,
            mainOption: true,
            verifier: '<your_verifier>',
            jwtParameters: {
              // ... your jwtParameters
            }
          },
          "upbond-wallet-tesnet-line": {
            name: "Upbond",
            description: "LINE with UPBOND Identity",
            typeOfLogin: "line",
            jwtParams: {
              // ... your jwt params
            },
            clientId: "<your_client_id>",
            logoHover: "",
            logoLight: "https://app.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
            logoDark: "https://app.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
            showOnModal: true,
            showOnDesktop: true,
            showOnMobile: true,
            mainOption: true,
            priority: 1,
          }
        },
        whiteLabel: {
          logoDark: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Cow_female_black_white.jpg',
          logoLight: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Cow_female_black_white.jpg',
        }
      })
      this.initialized = true
    }
  }

  async login() {
    try {
      if (this.upbond instanceof Upbond && this.web3 instanceof Web3) {
        const _provider = await this.upbond.login() // login using upbond
        this.web3.setProvider(this.upbond.provider)

        const accounts = await this.web3.eth.getAccounts()

        this.isLoggedIn = true
        this.provider = _provider
        return {
          msg: 'success',
          data: _provider,
          accounts
          // ... anything that you want to returns
        }
      }
    } catch (error) {
      console.log(error, '@errorOnReactProject?')
      return {
        msg: error.message || 'Failed to login',
        data: null
      }
    }
  }

  async loginOpenlogin() {
    const web3AuthInstance = new Web3Auth({
      chainConfig: {
        displayName: "Ethereum Mainnet",
        chainNamespace: "eip155",
        chainId: "0x13881",
        rpcTarget: `https://polygon-mumbai.infura.io/v3/74a97bae118345ecbadadaaeb1cf4a53`,
        blockExplorer: "https://polygonscan.com",
        ticker: "MATIC",
        tickerName: "Polygon"
      },
      clientId: 'BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU',
      authMode: "WALLET",
      uiConfig: {
        theme: "light",
        loginMethodsOrder: ["line", "google"],
        appLogo: "https://app.dev.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg" // Your App Logo Here
      }
    });

    const adapter = new OpenloginAdapter({
      adapterSettings: {
        network: "testnet",
        clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
        uxMode: "redirect",
        _iframeUrl: "http://localhost:3002",
        whiteLabel: {
          name: "UPBOND",
          logoLight: "https://app.dev.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
          logoDark: "https://app.dev.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
          defaultLanguage: "en",
          dark: false // whether to enable dark mode. defaultValue: false
        },
        loginConfig: {
          jwt: {
            verifier: "upbond-google-dev-tesnet",
            typeOfLogin: "jwt",
            name: "google",
            description: "UPBOND GOOGLE",
            clientId: "hxFv4SaQVXv3tE_rhe5u9",
            jwtParameters: {
              domain: "https://lzg2dndj.auth.dev.upbond.io",
              client_id: "hxFv4SaQVXv3tE_rhe5u9",
              connection: "google"
            }
          }
        }
      }
    });

    web3AuthInstance.configureAdapter(adapter)
    await web3AuthInstance.init()
    await web3AuthInstance.connectTo(adapter.name, {
      loginProvider: 'jwt',
      extraLoginOptions: {
        verifierIdField: "sub", // same as your JWT Verifier ID
        domain: "https://lzg2dndj.auth.dev.upbond.io",
        client_id: "hxFv4SaQVXv3tE_rhe5u9",
        response_type: "code id_token"
      }
    })
  }

  async logout() {
    try {
      if (this.upbond instanceof Upbond) {
        await this.upbond.logout()
        await this.upbond.cleanUp()
        window.location.reload()

        return {
          msg: 'success',
          data: true
        }
      }
    } catch (error) {
      return {
        msg: error.message || 'Failed to login',
        data: null
      }
    }
  }

  async getUserInfo() {
    if (this.upbond instanceof Upbond) {
      try {
        const userInfo = await this.upbond.getUserInfo()
        const provider = this.upbond.provider

        return userInfo
      } catch (error) {
        throw new Error(error)
      }
    }
  }

  async signTransaction(msg = "", account) {
    if (this.web3 instanceof Web3) {
      try {
        this.web3.setProvider(this.upbond.provider)
        const sign = await this.web3.eth.sign(msg, account)
        return sign
      } catch (error) {
        console.error(error)
        return null
      }
    }
  }
  async signWeb3Token(account) {
    this.web3.setProvider(this.upbond.provider)
    const sign = await Web3Token.sign(async (msg) => {
      if (this.web3 instanceof Web3) {
        return await this.web3.eth.personal.sign(msg, account)
      }
    }, '1d')
    return sign
  }
}


const upbondServices = new UpbondEmbed()

export default upbondServices
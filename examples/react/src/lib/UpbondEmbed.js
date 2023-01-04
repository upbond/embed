import Upbond from "./upbond-embed/upbondEmbed.esm";
import Web3 from "web3";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import Web3Token from "web3-token";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

class UpbondEmbed {

  // Initials
  upbond = null

  web3 = null

  // you can also using another envs.
  env = "v2_local"
  
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
        // isUsingDirect: false,
        skipDialog: false,
        dappRedirectUri: `${window.location.origin}/sapi`,
        network: {
          host: "https://matic-testnet-archive-rpc.bwarelabs.com",
          chainId: 80001,
          networkName: "Mumbai",
          blockExplorer: "",
          ticker: "MUMBAI",
          tickerName: "MUMBAI",
        },
        // selectedVerifier: 'upbond-wallet-tesnet-line',
        loginConfig: {
          "upbond-wallet-tesnet-line": {
            name: "Upbond",
            description: "LINE with UPBOND Identity",
            typeOfLogin: "line",
            jwtParams: {
              domain: "https://lzg2dndj.auth.dev.upbond.io",
              connection: "line",
              client_id: "FoQ_Ri8rKSXkHf82GRzZK",
              clientId: 'FoQ_Ri8rKSXkHf82GRzZK',
              scope: "openid email profile offline_access",
              // redirect_uri: "http://localhost:3000/auth",
            },
            jwtParameters: {
              domain: "https://lzg2dndj.auth.dev.upbond.io",
              connection: "line",
              client_id: "FoQ_Ri8rKSXkHf82GRzZK",
              clientId: 'FoQ_Ri8rKSXkHf82GRzZK',
              scope: "openid email profile offline_access",
            },
            clientId: "BGbtA2oA0SYvm1fipIPaSgSTPfGJG8Q6Ep_XHuZY9qQVW5jUXTMd0l8xVtXPx91aCmFfuVqTZt9CK79BgHTNanU",
            logo: "https://app.upbond.io/assets/images/common/UPBOND%E3%83%AD%E3%82%B4new-01.svg",
            showOnModal: true,
            showOnDesktop: true,
            showOnMobile: true,
            mainOption: true,
            priority: 1,
            buttonBgColor: '#faf',
            buttonTextColor: '#FFF'
          }
        },
        whiteLabel: {
          logo: 'https://awsimages.detik.net.id/community/media/visual/2022/11/24/kucing-bernama-soleh-jadi-pegawai-ditjen-pajak-dok-twitter-ditjenpajakri_169.jpeg?w=700&q=90',
          name: "SAPI",
          modalLogo: 'https://www.greeners.co/wp-content/uploads/2021/03/Kucing-Domestik-1.jpg',
          buttonLogo: 'https://cdn0-production-images-kly.akamaized.net/5TERlfRWmX7-a0Wu8BrpIE52Vrk=/1200x1200/smart/filters:quality(75):strip_icc():format(webp)/kly-media-production/medias/4005698/original/052533500_1650872118-pexels-dids-1302290.jpg',
          modalColor: '#3F03FF',
          primaryColor: '#3F03FF',
          isActive: true,
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
      toast.error(error.message || 'Some error occured')
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
          name: "SAPI",
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
      toast.error(error.message || 'Some error occured')
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

        return userInfo
      } catch (error) {
        toast.error(error.message || 'Some error occured')
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
        toast.error(error.message || 'Some error occured')
        return null
      }
    }
  }
  async signWeb3Token(account) {
    try {
      const ether = new ethers.providers.Web3Provider(this.upbond.provider)
      const signer = await ether.getSigner()
      const sign = await Web3Token.sign(async (msg) => {
        if (this.web3 instanceof Web3) {
          return await signer.signMessage(msg)
        }
      }, '1d')
      return sign
    } catch (error) {
      toast.error(error.message || 'Some error occured')
      return
    }
  }
}


const upbondServices = new UpbondEmbed()

export default upbondServices
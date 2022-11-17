import Upbond from "./upbond-embed/upbondEmbed.esm";
import Web3 from "web3";

class UpbondEmbed {

  // Initials
  upbond = null

  web3 = null

  // you can also using another envs.
  env = "direct-test"
  
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
        dappRedirectUri: window.location.origin,
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
}

const upbondServices = new UpbondEmbed()

export default upbondServices
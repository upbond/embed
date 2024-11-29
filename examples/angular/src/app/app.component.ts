import { AfterViewInit, Component, OnInit } from "@angular/core";
import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "@ethersproject/strings";
import { RelayProvider } from "@opengsn/provider";
import { ethers } from "ethers";
import { NgxSpinnerService } from "ngx-spinner";
import { ToastrService } from "ngx-toastr";
import Web3 from "web3";
import MinterAbi from "../assets/json/Mint.json";
import erc20Abi from "../assets/json/erc20Abi.json";
import { default as erc1155Abi, default as erc720Abi } from "../assets/json/erc720Abi.json";
import { UpbondService } from "./upbond.service";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit {
  isLoggedIn = this.service.upbond.isLoggedIn;
  account: any;
  data: any = "";
  isApproved = false;
  approvedRes = "0";
  toTransferAddress = "0x673d6c086E84e9Db30bD20450e4A4c3D5f627824";
  toTransferAddressERC721 = "0x673d6c086E84e9Db30bD20450e4A4c3D5f627824";
  tokenIdERC721 = "";
  contractERC721Address = "0x86e9B9A25b6ebf006Ad63220890ed48513d195CD";
  toTransferAddressERC1155 = "0x673d6c086E84e9Db30bD20450e4A4c3D5f627824";
  tokenIdERC1155 = "";
  contractERC1155Address = "0x86e9B9A25b6ebf006Ad63220890ed48513d195CD";
  amountTransferERC1155 = "";
  amountTransfer = "";
  consentData = {};
  allData = null;
  _upbond = this.service.upbond;
  network = {
    host: "mumbai",
    chainId: 80001,
    networkName: "mumbai",
    blockExplorer: "https://mumbai.polygonscan.com/",
    ticker: "MUMBAI",
    tickerName: "MUMBAI",
    rpcUrl: "https://polygon-mumbai.infura.io/v3/74a97bae118345ecbadadaaeb1cf4a53",
  };

  constructor(private spinner: NgxSpinnerService, private service: UpbondService, private toast: ToastrService) {}

  async ngOnInit() {
    this.spinner.show();
    if (!this.service.upbond.initialized) {
      await this.service.init();
    }
    this.spinner.hide();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.service.upbond) {
        this.isLoggedIn = this.service.upbond.isLoggedIn;
        if (this.isLoggedIn) {
          this.rehydrate();
        }
      }
    }, 3000);

    if (this._upbond) {
      if (this._upbond.on) {
        this._upbond.on("accountsChanged", (accounts: any) => {
          this.account = accounts[0];
        });

        this._upbond.on("chainChanged", (res: any) => {
          console.log(`Chain changed on: ${res}`);
          console.log("@@@ provider set to ->>", this._upbond);
        });

        this._upbond.on("connect", (res: any) => {
          console.log("onConnect?", res);
        });
      }
    }
  }

  renderJson(object: any) {
    return JSON.stringify(object, (key, value) => {
      switch (typeof value) {
        case "bigint":
          return {
            // warpper
            $T$: "bigint", // type   // maybe it is good to use some more complicated name instead of $T$
            $V$: value.toString(), // value  // maybe it is good to use some more complicated name instead of $V$
          };
        // Put more cases here ...
        default:
          return value;
      }
    });
  }

  async rehydrate() {
    let web3 = new Web3(this.service.upbond);
    web3.setProvider(this.service.upbond.provider);
    const accs = await web3.eth.getAccounts();
    if (accs.length > 0) {
      this.account = accs[0];
    }
  }

  async checkAllowance() {
    try {
      if (this.service.upbond && this.account) {
        let web3 = new Web3(this.service.upbond);
        web3.setProvider(this.service.upbond.provider);
        const tupbToken = new web3.eth.Contract(erc20Abi, "0x28111701BD21677EE35dBa0539A55ec22B262847") as any;
        //@ts-ignore
        const allowance: any = await tupbToken.methods.allowance(this.account, "0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b").call();
        if (allowance !== "0") {
          this.isApproved = true;
          this.approvedRes = allowance;
        }
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getBlockchainInfo() {
    let web3 = new Web3(this.service.upbond);
    web3.setProvider(this.service.upbond.provider);
    const [accounts, chainId] = await Promise.all([web3.eth.getAccounts(), web3.eth.getChainId()]);

    if ((chainId as any) === 80001) {
      const tupbToken = new web3.eth.Contract(erc20Abi, "0x28111701BD21677EE35dBa0539A55ec22B262847") as any;
      //@ts-ignore
      const tupbBalance = await tupbToken.methods.balanceOf(accounts[0]).call();
      //@ts-ignore
      this.data = JSON.stringify({
        erc20: ethers?.formatEther(tupbBalance) + " (TUPB | Testnet UPBOND)",
      });
    }

    if (accounts) {
      const balance: any = await web3.eth.getBalance(accounts[0]);
      const total = parseInt(balance) / Math.pow(10, 18);

      this.data = this.renderJson({
        address: accounts[0],
        balance: `${total.toString()} (MATIC)`,
        chainId,
      });
    }
  }

  async login() {
    try {
      const login = await this.service.login();
      this.account = login?.accounts ? login.accounts[0] : undefined;
      this.isLoggedIn = true;
    } catch (err: any) {
      this.toast.error(err);
    }
  }

  async userInfo() {
    try {
      const userInfo = await this.service.getUserInfo();
      this.data = JSON.stringify(userInfo);
    } catch (err: any) {
      this.toast.error(err);
    }
  }

  async signTransaction() {
    try {
      const msgHash = keccak256(toUtf8Bytes("Signing Transaction for Upbond Embed!"));
      await this.service.signTransaction(msgHash, this.account);
    } catch (err: any) {
      console.log(err);
      this.toast.error(JSON.stringify(err));
    }
  }

  async signTransactionWeb3Token() {
    try {
      await this.service.signWeb3Token(this.account);
    } catch (err: any) {
      this.toast.error(err);
    }
  }

  async logout() {
    await this.service.logout();
  }

  async minting() {
    this.spinner.show();
    const theAddress = this.account;
    try {
      const relay: any = await RelayProvider.newProvider({
        provider: this.service.upbond,
        config: {
          paymasterAddress: "0xD97B7555aaB3F89e36FE992d96454C41B2C5CEb8",
          pastEventsQueryMaxPageSize: 990,
        },
      }).init();
      const provider = new ethers.BrowserProvider(relay);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(
        "0xe697d83c65C1c450C19906AE10e5770C42D871aa", //nft contract
        MinterAbi,
        signer
      );
      const getDomain = await factory["DOMAIN_SEPARATOR"]();
      const keccak = keccak256(toUtf8Bytes(ethers.solidityPacked(["bytes32", "address"], [getDomain, theAddress])));
      const claimNft = await factory["claim"]("1", keccak);
      await claimNft.wait();
      this.spinner.hide();
    } catch (error: any) {
      this.spinner.hide();
      this.toast.error(error);
    }
  }

  async deploy() {
    try {
      this.spinner.show();
      let web3 = new Web3(this.service.upbond);
      web3.setProvider(this.service.upbond.provider);
      const [addr] = await web3.eth.getAccounts();
      const nonce = await web3.eth.getTransactionCount(addr);
      const transaction = {
        from: addr,
        to: this.account,
        value: 50000000000000000n,
        gas: 30000,
        nonce: nonce,
      };
      const tx = await web3.eth.sendTransaction(transaction);
      this.data = tx;
      this.spinner.hide();
    } catch (error: any) {
      this.spinner.hide();
      this.toast.error(error);
    }
  }

  async approve() {
    try {
      await this.checkAllowance();

      if (this.isApproved) {
        this.toast.error(`you're approved`);
        return;
      }

      this.spinner.show();
      let web3 = new Web3(this.service.upbond);
      web3.setProvider(this.service.upbond.provider);
      const tupbToken = new web3.eth.Contract(erc20Abi, "0x28111701BD21677EE35dBa0539A55ec22B262847") as any;
      const balance = await tupbToken.methods.balanceOf(this.account).call();
      if (balance !== "0") {
        await tupbToken.methods
          .approve("0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b", "115792089237316195423570985008687907853269984665640564039457584007913129639935")
          .send({ from: this.account });
        this.spinner.hide();
        this.isApproved = true;
        this.toast.success(`Your account has been approved`);
      } else {
        this.spinner.hide();
        this.toast.error(`You don't have TUPB token`);
        return;
      }
    } catch (error: any) {
      this.spinner.hide();
      console.error(error);
      this.toast.error(error.message || "Error occured!");
    }
  }

  claimTUPBToken = async () => {
    try {
      this.spinner.show();
      const wallet = new ethers.Wallet(
        "1a7b09c99e5dbba3bc614003afc86a71965f03ab204e2fe9f01801badcbb1cbf",
        new ethers.JsonRpcProvider(this.network.rpcUrl)
      );
      const tupbTokenContract = new ethers.Contract("0x28111701BD21677EE35dBa0539A55ec22B262847", erc20Abi, wallet) as any;
      const transfer = await tupbTokenContract.transfer(this.account[0], ethers.parseEther("2"), {
        gasLimit: 61000,
      });
      await transfer.wait();
      await this.getBlockchainInfo();
      this.spinner.hide();
      this.toast.success(`Success transfer TUPB token to your account`);
    } catch (error: any) {
      this.spinner.hide();
      this.toast.error(error.message || "Error occured!");
    }
  };

  transfer = async () => {
    try {
      this.spinner.show();
      let web3 = new Web3(this.service.upbond);
      web3.setProvider(this.service.upbond.provider);
      const tupbToken = new web3.eth.Contract(erc20Abi, "0x28111701BD21677EE35dBa0539A55ec22B262847") as any;
      const balance = await tupbToken.methods["balanceOf"](this.account).call();
      const decimal = await tupbToken.methods["decimals"]().call();
      if (parseInt(balance) > 0 && parseInt(this.amountTransfer) < parseInt(balance)) {
        await tupbToken.methods["transfer"](this.toTransferAddress, ethers.parseUnits(this.amountTransfer, 18)).send({ from: this.account });
        this.toast.success(`Success Transfer to ${this.toTransferAddress}`);
        this.spinner.hide();
      } else {
        this.spinner.hide();
        this.toast.error(`Amount exceed balance`);
      }
    } catch (error: any) {
      this.spinner.hide();
      this.toast.error(error.message || "Error occured!");
    }
  };

  transferERC721 = async () => {
    try {
      this.spinner.show();
      let web3 = new Web3(this.service.upbond);
      web3.setProvider(this.service.upbond.provider);
      const erc721Contract = new web3.eth.Contract(erc720Abi, this.contractERC721Address) as any;
      await erc721Contract.methods["safeTransferFrom"](this.account, this.toTransferAddressERC721, this.tokenIdERC721, "0x").send({
        from: this.account,
      });
      this.toast.success(`Success Transfer to ${this.toTransferAddressERC721}`);
      this.spinner.hide();
    } catch (error: any) {
      this.spinner.hide();
      this.toast.error(error.message || "Error occured!");
    }
  };

  transferERC1155 = async () => {
    try {
      this.spinner.show();
      let web3 = new Web3(this.service.upbond);
      web3.setProvider(this.service.upbond.provider);
      const erc1155Contract = new web3.eth.Contract(erc1155Abi, this.contractERC1155Address) as any;
      await erc1155Contract.methods["safeTransferFrom"](
        this.account,
        this.toTransferAddressERC1155,
        this.tokenIdERC1155,
        this.amountTransferERC1155,
        "0x"
      ).send({ from: this.account });
      this.toast.success(`Success Transfer to ${this.toTransferAddressERC1155}`);
      this.spinner.hide();
    } catch (error: any) {
      this.spinner.hide();
      this.toast.error(error.message || "Error occured!");
    }
  };

  openWallet = () => {
    this.service.upbond.showWallet("home");
  };

  async consent() {
    try {
      const data = await this.service.upbond.consent.getUserData();

      this.data = JSON.stringify(data.requestedData.data);
    } catch (error: any) {
      this.toast.error(error.message || "Error occured!");
    }
  }
}

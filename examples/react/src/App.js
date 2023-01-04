import { UpbondLogo } from "assets";
import SpinnerLoading from "component/SpinnerLoading";
import upbondServices from "lib/UpbondEmbed";
import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import Web3 from "web3";
import asobiAbi from './asobiMint.json';

/* 
  Read this:
  This concept actually can be also using hooks (functional), you may can decide what you want to do
  if you're using hooks, sure you can put the new Upbond({}) on the useState.
  We're using this example because we're usually using this method for implementing the @upbond/upbond-embed lib
*/

const erc20FactoryContract = '0xc80101fA4E473F47Fea06288FbF0D2ff8C9fF9e7'
const mintContract = '0x9008347b7b15C99cA963A750e03cAb4801620188'

const App = () => {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [signInfo, setSignInfo] = useState(null);
  const [isShowUserInfo, setIsShowUserInfo] = useState(false);
  const [showBc, setShowBc] = useState(false);
  const [isCopy, setIsCopy] = useState(false);
  const [txResult, setTxResult] = useState({});
  const [bcState, setBcState] = useState({
    address: '',
    chainId: 0,
    balance: 0
  })
  const _upbond = upbondServices.upbond.provider;

  useEffect(() => {
    const initUpbond = async () => {
      setLoading(true)
      try {
        await upbondServices.init()
      } catch (error) {
        console.error(`Error initialization: `, error)
      }
      setLoading(false)
    }
    if (upbondServices.initialized) {
      return
    }
    initUpbond()
  }, [])

  const getBlockchainInfo = async () => {
    if (showBc) {
      setShowBc(false)
      return;
    }
    const web3 = new Web3(_upbond);
    const [accounts, chainId] = await Promise.all([
      web3.eth.getAccounts(),
      web3.eth.getChainId()
    ])
    if (accounts) {
      const balance = await web3.eth.getBalance(accounts[0]);
      setShowBc(true)
      setBcState({
        address: accounts[0],
        balance: `${parseInt(balance) / Math.pow(10, 18)} (MATIC)`,
        chainId
      })
    }
  }

  const login = async () => {
    setLoading(true)
    try {
      const login = await upbondServices.login()
      if (login.data !== null) {
        setAccount(login.accounts)
        setLoading(false)
        return
      }
      setLoading(false)
    } catch (error) {
      toast.error(error.message || 'Some error occured')
      setLoading(false)
      console.error(error)
      throw new Error(error)
    }
  };

  const getUser = async () => {
    if (isShowUserInfo) {
      setIsShowUserInfo(false)
      return;
    }
    setLoading(true);
    try {
      const getData = await upbondServices.getUserInfo();
      setUserInfo(getData);
      setIsShowUserInfo(true);
      setLoading(false);
    } catch (error) {
      toast.error(error.message || 'Some error occured')
      console.error(error, '@errorOnGetUser')
      setIsShowUserInfo(true);
      setLoading(false);
    }
  };

  const signTransaction = async () => {
    try {
      setIsCopy(false)
      setLoading(true)
      const msgHash = Web3.utils.keccak256('Signing Transaction for Upbond Embed!')
      const signedMsg = await upbondServices.signTransaction(msgHash, account[0])
      console.log(signedMsg)
      setSignInfo(signedMsg)
    } catch (error) {
      toast.error(error.message || 'Some error occured')
      console.error(error)
      setLoading(false)
    }
  }

  const signWeb3Token = async () => {
    try {
      setIsCopy(false)
      const signedMsg = await upbondServices.signWeb3Token(account[0])
      if (signedMsg) {
        setSignInfo(`${signedMsg}`)
      } else {
        setSignInfo('Output error. Maybe rejected or provider is invalid')
      }
    } catch (error) {
      toast.error(error.message || 'Some error occured')
    }
  }

  const deploy = async () => {
    try {
      const web3 = new Web3(_upbond)
      const [addr] = await web3.eth.getAccounts()
      const nonce = await web3.eth.getTransactionCount(addr)
      
      const transaction = {
        'from': addr,
        'to': '0x550FBF95B0dF5AAbEb230649385d9f857f7561fF', // faucet address to return eth
        'value': 1000000000000000000, // 1 ETH
        'gas': 30000,
        'nonce': nonce,
      };

      const tx = await web3.eth.sendTransaction(transaction)
      console.log(tx, '@TX???')
      delete tx.logs
      delete tx.contractAddress
      setTxResult(tx)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Error occured!')
    }
  }

  useEffect(() => {
    const init = async () => {
      if (upbondServices.upbond) {
        if (upbondServices.upbond.isLoggedIn) {
          setLoading(true)
          const user = await upbondServices.getUserInfo()
          if (user) {
            const web3 = new Web3(_upbond)
            const account = await web3.eth.getAccounts()
            setAccount(account)
            setLoading(false)
          }   
          setLoading(false)
        }
      }
    }
    init()
  }, [_upbond])

  useEffect(() => {
    if (_upbond) {
      if (_upbond.on) {
        _upbond.on("accountsChanged", (accounts) => {
          console.log(`Account changed: ${accounts}`)
        })

        _upbond.on("chainChanged", (res) => {
          console.log(`Chain changed on: ${res}`)
        })

        _upbond.on("connect", (res) => {
          console.log('onConnect?', res)
        })
      }
    }
  }, [_upbond])

  useEffect(() => {
    console.log({ txResult })
  }, [txResult])

  return (
    <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
      <header className="App-header">
        <p className="text-center uppercase font-bold my-3">
          sample dapps with upbond embed
        </p>
        <img src={UpbondLogo} className="w-1/2 mx-auto" alt="UpbondBanner" />
        {account ? (
          <>
            <div>
              <p className="text-center">Account : {account}</p>

              <div className="flex justify-center mt-3 gap-3">
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={getUser}
                >
                  Toggle User Info
                </button>
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={getBlockchainInfo}
                >
                  Toggle blockchain info
                </button>
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={async () => await upbondServices.logout()}
                >
                  Logout
                </button>
              </div>
              {/* User Info */}
              {(userInfo && isShowUserInfo) && (
                <div className="text-center my-3">
                  <p className="font-bold">User Info</p>
                  <img
                    className="inline-block h-14 w-14 rounded-full"
                    src={userInfo.profileImage}
                    alt=""
                  />
                  <p>Name: {userInfo.name}</p>
                  <p>Email: {userInfo.email}</p>
                  <p>Login with: {userInfo.typeOfLogin}</p>
                  <p>Verifier: {userInfo.verifier}</p>
                </div>
              )}
              {/* bc info */}
              {(showBc && bcState.chainId !== 0) && (
                <div className="text-center my-3">
                  <p className="font-bold">Blockchain Info</p>
                  {
                    Object.keys(bcState).map((x) => (
                      <p className="text-black" key={x}>{x}: {bcState[x]}</p>
                    ))
                  }
                </div>
              )}
              <div className="flex flex-1 justify-center space-x-5 mt-2">
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={signTransaction}
                >
                  Sign Transaction
                </button>
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={signWeb3Token}
                >
                  Sign Web3Token
                </button>
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={deploy}
                >
                  Send Transaction
                </button>
              </div>
              <p className="text-black mt-5">Output: </p>
              <div className="overflow-hidden rounded-lg bg-white shadow mt-2">
                <div className="px-4 py-5 sm:p-6 whitespace-pre-line break-words">
                  {signInfo ? signInfo : 'Output error. Maybe rejected or provider is invalid'}
                </div>
              </div>
              {
                signInfo && (
                  <button
                    type="button"
                    className="inline-flex mt-5 items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={async () => {
                      await navigator.clipboard.writeText(signInfo)
                      setIsCopy(true)
                    }}
                  >
                    {isCopy ? 'Copied' : 'Copy'}
                  </button>
                )
              }
              { Object.keys(txResult).length > 0 && (<p className="text-black mt-5">Transaction Output: </p>) }
              {
                Object.keys(txResult).length > 0 && Object.keys(txResult).map((x) => (
                  <div className="overflow-hidden rounded-lg bg-white shadow mt-2" key={x}>
                    <div className="px-4 py-5 sm:p-6 whitespace-pre-line break-words">
                      {x}: {txResult[x]}
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            {loading === true ? (
              <SpinnerLoading />
            ) : (
              <div className="flex flex-1 flex-col space-y-3">
                <button
                  type="button"
                  className="mx-auto px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500  w-1/4"
                  onClick={login}
                >
                  Login 3.0
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  );
};

export default App;

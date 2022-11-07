import { UpbondLogo } from "assets";
import SpinnerLoading from "component/SpinnerLoading";
import upbondServices from "lib/UpbondEmbed";
import { useEffect, useState } from "react";
import Web3 from "web3";

/* 
  Read this:
  This concept actually can be also using hooks (functional), you may can decide what you want to do
  if you're using hooks, sure you can put the new Upbond({}) on the useState.
  We're using this example because we're usually using this method for implementing the @upbond/upbond-embed lib
*/

const App = () => {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [signInfo, setSignInfo] = useState(null);
  const _upbond = upbondServices.upbond.provider;

  const [upbondProvider, setUpbondProvider] = useState(null)

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

  const login = async () => {
    setLoading(true)
    try {
      const login = await upbondServices.login()
      if (login.data !== null) {
        setUpbondProvider(login.data)
        setAccount(login.accounts)
        setLoading(false)
        return
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error(error)
      throw new Error(error)
    }
  };

  const getUser = async () => {
    setLoading(true);
    try {
      const getData = await upbondServices.getUserInfo();
      setUserInfo(getData);

      setLoading(false);
    } catch (error) {
      console.error(error, '@errorOnGetUser')
      setLoading(false)
    }
  };

  const signTransaction = async () => {
    try {
      const msgHash = Web3.utils.keccak256('Signing Transaction for Upbond Embed!')
      const signedMsg = await upbondServices.signTransaction(msgHash, account[0])
      console.log(signedMsg)
      setSignInfo(signedMsg)
    } catch (error) {
      console.error(error)
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
            setUpbondProvider(_upbond)
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
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={getUser}
                >
                  Get User Info
                </button>
              </div>
              {/* User Info */}
              {userInfo && (
                <div className="text-center my-3">
                  <p className="font-bold">User Info</p>
                  <p>Name: {userInfo.name}</p>
                  <p>Email: {userInfo.email}</p>
                </div>
              )}
              <div className="flex flex-1 justify-center space-x-5 mt-2">
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={signTransaction}
                >
                  Sign Transaction
                </button>
                <button
                  type="button"
                  className="items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={async () => await upbondServices.logout()}
                >
                  Logout
                </button>
              </div>
              <div className="flex justify-center mt-3 gap-3">
                {
                  signInfo !== null && (
                    <p className="text-black">Signed with sign: {signInfo}</p>
                  )
                }
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            {loading === true ? (
              <SpinnerLoading />
            ) : (
              <button
                type="button"
                className="mx-auto px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500  w-1/4"
                onClick={login}
              >
                Login
              </button>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import upbondServices from "../libs/embed";
import { ethers } from "ethers";

export default function List() {
  const { user, getIdTokenClaims, } = useAuth0();
  const [result, setResult] = useState<string>();

  const init = async () => {
    const idToken = await getIdTokenClaims();
    upbondServices.init({ idToken: idToken?.__raw });
  }
  useEffect(() => {
    if (user) init();
  }, [user])


  const signTransaction = async () => {
    const account = await upbondServices.getAccounts();
    const hash = await upbondServices.signTransaction("Hello world", account);
    setResult(hash);
  }

  const sendTransaction = async () => {
    try {
      const account = await upbondServices.getAccounts();
      console.log("account abc", account);
      const send = await upbondServices.sendTransaction({ to: account, value: ethers.utils.parseEther("0.0001").toString() })
      console.log("txHash", send);
    } catch (error: any) {
      setResult("Error: " + error?.message || "Unknown error")
    }
  }

  const signWeb3Token = async () => {
    try {
      const account = await upbondServices.getAccounts();
      const signedMsg = await upbondServices.signWeb3Token(account);
      if (signedMsg) {
        setResult(signedMsg);
      } else {
        setResult("Rejected")
      }
    } catch (error: any) {
      setResult("Error: " + error?.message || "Unknown error")
    }
  };

  return (
    <>
      <div className="text-black">
        <p>Email: {user?.email}</p>
        <p>Address: {user?.wallet_address}</p>
      </div >
      <ul className="divide-y divide-gray-100">
        <li className="flex items-center justify-between gap-x-6 py-5">
          <div className="min-w-0">
            <div className="flex items-start gap-x-3">
              <p className="text-sm font-semibold leading-6 text-gray-900">Sign transaction</p>
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            <button
              onClick={() => signTransaction()}
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
            >
              Execute
            </button>
          </div>
        </li>

        <li className="flex items-center justify-between gap-x-6 py-5">
          <div className="min-w-0">
            <div className="flex items-start gap-x-3">
              <p className="text-sm font-semibold leading-6 text-gray-900">Send transaction</p>
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            <button
              onClick={() => sendTransaction()}
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
            >
              Execute
            </button>
          </div>
        </li>

        <li className="flex items-center justify-between gap-x-6 py-5">
          <div className="min-w-0">
            <div className="flex items-start gap-x-3">
              <p className="text-sm font-semibold leading-6 text-gray-900">Sign web3 token</p>
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            <button
              onClick={() => signWeb3Token()}
              className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
            >
              Execute
            </button>
          </div>
        </li>
      </ul>
      <div className="text-black text-wrap">
        Result: {result}
      </div>
    </>
  )
}

"use client";

import { useAuth0 } from "@auth0/auth0-react";
import List from "./list";

export default function Home() {
  const { loginWithRedirect, isLoading, isAuthenticated, logout } = useAuth0();

  const login = () => {
    if (!isAuthenticated && !isLoading) {

      console.log("@logging in")
      loginWithRedirect({ authorizationParams: { flow: "security" } })
    }
  }

  const logoutRedirect = () => {
    if (isAuthenticated) {
      console.log("@logging out")
      logout({ logoutParams: { returnTo: window.location.origin } })
    }
  }

  return (
    <div className="bg-white h-screen">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          {!isAuthenticated ? (<div className="text-center">
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isLoading ? <p>Loading...</p> : <button
                onClick={() => login()}
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Login
              </button>}
            </div>
          </div>)
            :
            <>
              <List />
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <button
                  onClick={() => logoutRedirect()}
                  className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Logout
                </button>
              </div>
            </>
          }
        </div>
      </div>
    </div>
  );
}

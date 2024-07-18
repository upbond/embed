'use client';

import { Auth0Provider } from '@auth0/auth0-react';

export function Providers({ children }: any) {
  return (
    <Auth0Provider
      clientId={process.env.NEXT_PUBLIC_AUTHSERVICE_CLIENT_ID as string}
      domain={process.env.NEXT_PUBLIC_LOGIN_UPBOND_DOMAIN as string}
      authorizationParams={{ redirect_uri: process.env.NEXT_PUBLIC_URL, scope: "openid profile" }}>
      {children}
    </Auth0Provider>
  );
}
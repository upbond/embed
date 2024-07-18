![alt text](https://github.com/upbond/embed/blob/master/assets/upbond_logo.png?raw=true)
# **Upbond Embed**
****************with npm****************

```terminal  
npm install @upbond/upbond-embed
```

******************with yarn******************

```terminal
yarn add @upbond/upbond-embed 
```

## **Initialization**

This is the main class of anything related to Upbond Embed

```javascript
const Upbond = require("@upbond/upbond-embed");
```

Using ES6

```javascript
import Upbond  from "@upbond/upbond-embed";
```

Then, create a new instance of Upbond

```javascript
const upbond = new Upbond(options);
```

************Parameters************

- `options` (optional) : The options of the constructor
    - `buttonPosition` (optional) : string, default is `BOTTOM_LEFT` <br />
    The position of the Upbond button. Supported values are `top-left` `bottom-left` `top-right` `bottom-right`. Or you can following this code:
    ```javascript
      BOTTOM_LEFT: "bottom-left",
      TOP_LEFT: "top-left",
      BOTTOM_RIGHT: "bottom-right",
      TOP_RIGHT: "top-right",
    ```
    - `buttonSize` (optional) : number, default is `56`
    - `modalZIndex` (optional): number, default is `99999`


Then, initialize Upbond embed

```javascript
await upbond.init({
  buildEnv: UPBOND_BUILD_ENV.PRODUCTION
});
```

************Initializing with idToken from Login 3.0************

In addition to the standard initialization method, UPBOND Embed can be initialized using an `idToken` from Login 3.0 to the `state` variable This allows developers to bypass the `upbond.login()` function, directly creating a login session. Please refer to the Login 3.0 sample codes for the implementation.

```javascript
  await this.upbond.init({
    buildEnv: UPBOND_BUILD_ENV.PRODUCTION,
    state: idToken
    });
```

************Parameters************

- `buildEnv` (required): `UPBOND_BUILD_ENV` build environment settings: Build environments are divided into 3 types of environment usages: production and staging. Below is the definition or `UPBOND_BUILD_ENV` in the embed library.
```
  PRODUCTION: "production",
  STAGING: "staging",
  .
  .
  .
```
`UPBOND_BUILD_ENV.PRODUCTION`, `UPBOND_BUILD_ENV.STAGING` always point to the newest environment.

- `widgetConfig` (optional): Configuration to show embed button `before` or `after` logins.
```javascript
  widgetConfig: {
    showAfterLoggedIn: true,
    showBeforeLoggedIn: false,
  }
```

- `network` (optional): Blockchain network configuration to connect. Default to `matic` network.
```javascript
network: {
  host: "mumbai",
  chainId: 80001,
  networkName: "Mumbai",
  blockExplorer: "",
  ticker: "MUMBAI",
  tickerName: "MUMBAI",
  rpcUrl: "https://polygon-testnet.public.blastapi.io/",
}
```

- `dappRedirectUri` (optional): Redirect URI after successful login from Embed. Default to the dApps URI. `${window.location.origin}/`
```javascript
  dappRedirectUri: "https://demo-dapps.com"
```

**Examples**

```javascript
import Upbond, { UPBOND_BUILD_ENV, BUTTON_POSITION_TYPE } from "@upbond/upbond-embed";

const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT, // default: 'bottom-left'
  buttonSize: 56, // optional
  modalZIndex: 150, // optional
});

await upbond.init({
  buildEnv: UPBOND_BUILD_ENV.PRODUCTION,
  widgetConfig: {
    showAfterLoggedIn: true,
    showBeforeLoggedIn: false,
  },
  network: {
    host: "mumbai",
    chainId: 80001,
    networkName: "Mumbai",
    blockExplorer: "",
    ticker: "MUMBAI",
    tickerName: "MUMBAI",
    rpcUrl: "https://polygon-testnet.public.blastapi.io/",
  },
  dappRedirectUri: "https://demo-dapps.com"
});
```

## **Cleanup**

This cleans up the iframe and buttons created by upbond package. If the user is logged in, it logs him out first and then cleans up.
This will be return `Promise<void>`: Returns a promise which resolves to void.
******************Examples:******************

```javascript
await upbond.cleanUp(); 
```

# ACCOUNT

user account management

## Login

Prompts the user to login if they are not logged in. If an OAuth verifier is not provided, a modal selector will be shown.

******************Examples:******************

```javascript 
import Upbond, { UPBOND_BUILD_ENV, BUTTON_POSITION_TYPE } from "@upbond/upbond-embed";

// Your code ...
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150
});

const [initialized, setInitialized] = useState(false)

useEffect(() => {
  const init = async () => {
    await upbond.init({
      buildEnv: UPBOND_BUILD_ENV.PRODUCTION
    });
    setInitialized(true)
  }
  if (!initialized) {
    init()
  }
}, [])

const loginEmbed = async () => {
  try {
    await upbond.login();
  } catch(err) {
    throw new Error(err)
  }
}

return (
  // render yours
)
```

## Logout

Logs the user out of Upbond. Requires that a user is logged in already.

******************Examples:******************

```javascript
import Upbond, { UPBOND_BUILD_ENV, BUTTON_POSITION_TYPE } from "@upbond/upbond-embed";

// Your code ...
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150
});

const [initialized, setInitialized] = useState(false)

useEffect(() => {
  const init = async () => {
    await upbond.init({
      buildEnv: UPBOND_BUILD_ENV.PRODUCTION
    });
    setInitialized(true)
  }
  if (!initialized) {
    init()
  }
}, [])

const logout = async () => {
  try {
    await upbond.logout();
  } catch(err) {
    throw new Error(err)
  }
}

return (
  // render yours
)
```

## GetUserInfo

Returns the logged-in user's info including name, email, and imageUrl. Only works if the user is logged in. In every `session`, only the first call opens the popup for the user's consent to access this information. All subsequent requests within the session don't trigger the popup.

******************Examples:******************

```javascript
const userInfo = await upbond.getUserInfo();
```

**Returns**

- `Promise<UserInfo>` : Returns a promise which resolves to `UserInfo` object.

```typescript
interface UserInfo {
  email: string;
  name: string;
  profileImage: string;
  verifier: string;
  verifierId: string;
}
```

# Web3 Provider

assign upbond provider to use in Web3

## Use Upbond Provider

****************Examples****************

```javascript
import web3 from 'web3'

const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150
});

/* ... Your upbond embed code ... 
  You need to login to upbond embed first for get the ethereum 
  provider returned from upbond embed
*/

const web3 = new Web3(upbond.provider);
const account = await web3.eth.getAccounts() 
 //[0x000] - your account
```

# EIP-1193

handling some function eip-1193 function [EIP-1193](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md)

******Examples:******

```javascript 
import web3 from 'web3'
import Upbond, { UPBOND_BUILD_ENV, BUTTON_POSITION_TYPE } from "@upbond/upbond-embed";

const upbond = new Upbond(); 
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150
});

/* ... Your upbond embed code ... 
  You need to login to upbond embed first for get the ethereum 
  provider returned from upbond embed
*/

upbond.provider.on("chainChanged", (resp) => {
    console.log(resp, "chainchanged");
});

upbond.provider.on("accountsChanged", (accounts) => {
    console.log(accounts, "accountsChanged");
});
```

If you want to use the upbond provider, sure you can use on a react lifecycles like this: 

```javascript
useEffect(() => {
if (upbond.provider) {
    if (upbond.provider.on) {
      upbond.provider.on("chainChanged", (resp) => {
          console.log(resp, "chainchanged");
      });

      upbond.provider.on("accountsChanged", (accounts) => {
          console.log(accounts, "accountsChanged");
      });
    }
  }
}, [upbond.provider])

```

# Dapps Example

**React**

You can check this out [here](https://github.com/upbond/embed/tree/master/examples/react)

**Demo Dapps**

You can also check our example in action [here](https://demo.upbond.io)

# Whitelabel Example

Use `whiteLabel` option inside the init configuration. 

**Example in React:**

```jsx
import Upbond from "@upbond/upbond-embed";

const Example = () => {
  const upbond = new Upbond({})

  const init = async () => {
    await upbond.init({
      whiteLabel: {
        walletTheme: {
          name: "Sample App",
          lang: "ja",
          logo: "https://miro.medium.com/max/1200/1*jfdwtvU6V6g99q3G7gq7dQ.png",
          buttonLogo: "https://cdn.freebiesupply.com/images/large/2x/medium-icon-white-on-black.png",
          modalColor: "#f3f3f3",
          bgColor: "#214999",
          bgColorHover: "#f3f3f3",
          textColor: "#f3f3f3",
          textColorHover: "#214999",
          upbondLogin: {
            globalBgColor: "#f3f3f3",
            globalTextColor: "#214999"
          }
        }
      },
    })
  }
  
  useEffect(() => init(), [])

  return (
    // ...
  )
}
```

**Example in Vue:**

```jsx
<script>
import Upbond from "@upbond/upbond-embed";

const upbond = new Upbond();
const init = async () => {
  await upbond.init({
    whiteLabel: {
      walletTheme: {
        name: "Sample App",
        lang: "ja",
        logo: "https://miro.medium.com/max/1200/1*jfdwtvU6V6g99q3G7gq7dQ.png",
        buttonLogo: "https://cdn.freebiesupply.com/images/large/2x/medium-icon-white-on-black.png",
        modalColor: "#f3f3f3",
        bgColor: "#214999",
        bgColorHover: "#f3f3f3",
        textColor: "#f3f3f3",
        textColorHover: "#214999",
        upbondLogin: {
          globalBgColor: "#ffffff",
          globalTextColor: "#214999"
        }
      }
    },
  })
}

export default {
  mounted() {
    init()
  }
}
</script>

<template>
  // ...
</template>
```

## **Whitelabel wallet theme option**

Setting up the color theme and logo.

```jsx
whiteLabel: {
  /* wallet theme */
  walletTheme: {
    // other
    name: "Sample App",
    lang: "ja",
    // Logo setup
    logo: "path or url",
    buttonLogo: "path or url",

    // Color theme setup
    modalColor: "color hex",
    bgColor: "color hex",
    bgColorHover: "color hex",
    textColor: "color hex",
    textColorHover: "color hex",
    
    // Upbond login theme setup
    upbondLogin: {
      globalBgColor: "color hex",
      globalTextColor: "color hex"
    }
  }
}
```

- `name` let you setup the application’s name.
- `lang` let you setup the wallet's language. Current options include `en` for English and `ja` for Japanese. Default is English.
- `logo` let you setup logo that will be displayed the login popup.
- `buttonLogo` let you setup the logo for the flying wallet button.
- `modalColor` let you setup the background color for the login popup.
- `bgColor` let you setup the buttons background color.
- `bgColorHover` let you setup the hovered buttons background color.
- `textColor` let you setup the color of the buttons text and some text on the notification popup.
- `textColorHover` let you setup the color of the hovered text inside buttons and some text on the notification popup.
- `upbondLogin.globalBgColor` let you setup the color of the background on Upbond login site.
- `upbondLogin.globalTextColor` let you setup the color of the text on Upbond login site.

### Example white-labelled UI

![whitelabel](https://user-images.githubusercontent.com/605150/212630002-30a049a9-3539-43b7-8b48-1ffa83ef7008.png)

# Current version

version: v2.x

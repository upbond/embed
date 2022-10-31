# **Installation**

****************with npm****************

``` 
npm install @upbond/upbond-embed
```

******************with yarn******************

``` 
yarn add @upbond/upbond-embed 
```

# **Initialization**

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
    - `apiKey` (optional): string

**Examples**

```javascript
import Upbond, { UPBOND_BUILD_ENV, BUTTON_POSITION_TYPE } from "@upbond/upbond-embed";

const upbond = new Upbond(); 
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT, // default: 'bottom-left'
  buttonSize: 56,
  modalZIndex: 150,
  apiKey: '<your-api-key>'
});

await upbond.init({
  buildEnv: UPBOND_BUILD_ENV.TESTING
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
const upbond = new Upbond(); 
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150,
  apiKey: '<your-api-key>'
});

const [initialized, setInitialized] = useState(false)

useEffect(() => {
  const init = async () => {
    await upbond.init({
      buildEnv: UPBOND_BUILD_ENV.TESTING
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
const upbond = new Upbond(); 
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150,
  apiKey: '<your-api-key>'
});

const [initialized, setInitialized] = useState(false)

useEffect(() => {
  const init = async () => {
    await upbond.init({
      buildEnv: UPBOND_BUILD_ENV.TESTING
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

const upbond = new Upbond(); 
const upbond = new Upbond({
  buttonPosition: BUTTON_POSITION_TYPE.BOTTOM_LEFT,
  buttonSize: 56,
  modalZIndex: 150,
  apiKey: '<your-api-key>'
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
  modalZIndex: 150,
  apiKey: '<your-api-key>'
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

Repository: [dapps-upbond-embed-example](https://github.com/upbond/dapps-embed-example)

# Current version

version: v1.0.0
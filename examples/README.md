## Environment Configuration

Before setting up the development environment, configure the necessary environment variables. Below is a sample configuration for the staging environment:

```
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_AUTHSERVICE_CLIENT_ID=B2GBRrZR2nn2P5exjaF1T
NEXT_PUBLIC_LOGIN_UPBOND_DOMAIN=https://auth-wallet.stg.upbond.io
```

Ensure that these environment variables are correctly set in a `.env.local` file in your project root.

## Setup Instructions

### 1. Clone the Repository

Begin by cloning the embed repository to your local machine:

```
git clone https://github.com/upbond/embed.git
cd embed
```

### 2. Install Dependencies and Build the Embed Package

The embed package needs to be built before it can be used. To do this, run the following commands:

```
npm install --legacy-peer-deps
npm run build
```

This step ensures that all dependencies are installed correctly and that the package is compiled.

### 3. Run the Example Application

To start the development server and test the example implementation, navigate to the `examples` directory and install dependencies:

```
cd examples
npm install --legacy-peer-deps
npm run dev
```

Once the server is running, you can access the example application in your browser at:

- [http://localhost:3000](http://localhost:3000/)

### 4. Understanding the Build Environment

The example implementation is configured for the staging environment using `v3_staging` as the `buildEnv`. If you need to modify this for production or other environments, update the environment variables accordingly.

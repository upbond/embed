const path = require("path");
const fs = require("fs/promises");

const main = async () => {
  try {
    const absolutePath = path.resolve("", "");
    const frontPath = path.resolve("../", "mpc-wallet/src/libs/embed")
    // const frontPath = path.resolve("../", "embed-sample-v2/src/embed")
    try {
      await fs.access(frontPath);
      console.log(`The folder '${frontPath}' exists. Deleting it...`);
      await fs.rm(frontPath, { recursive: true });
      console.log("Folder deleted.");
    } catch (error) {
      console.log(`The folder '${frontPath}' does not exist.`, error);
    }
    const readDist = await fs.readdir(`${absolutePath}`);
    for (let i in readDist) {
      if (readDist[i] === "dist") {
        // put your dist path here ...
        const distPath = `${absolutePath}/${readDist[i]}`;
        await fs.rename(distPath, frontPath);
      }
    }
    console.log(frontPath);
  } catch (error) {
    throw new Error(error);
  }
};

main().catch(console.error);

const path = require("path");
const fs = require("fs/promises");

const main = async () => {
  try {
    const absolutePath = path.resolve("", "");
    const frontPath = path.resolve("../", "react-upbond-embed/embed");
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

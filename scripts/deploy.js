const { hre, ethers, run, network } = require("hardhat");

async function main() {
  const args = {
    // define arguments for deployment constructor call
    mint_price: "20000000000000000", // .02 MATIC
    max_tokens: 3,
    base_uri:
      "https://pin.dgs-creative.com/nodeinfo/12D3KooWD314neAfbdpdasMrR5MVFXg6q6mnHXj2seaKoGnKE6xo",
    royaltyArtist: process.env.STUNT_WALLET_ADDRESS,
    royaltyBasis: 500,
  };
  const MACT6340ContractFactory = await ethers.getContractFactory(
    "MACT6340Contract"
  );
  // deploy
  const MACT6340Contract = await MACT6340ContractFactory.deploy(
    args.mint_price,
    args.max_tokens,
    args.base_uri,
    args.royaltyArtist,
    args.royaltyBasis
  );
  console.log("Deploying...");
  await MACT6340Contract.waitForDeployment(
    args.mint_price,
    args.max_tokens,
    args.base_uri,
    args.royaltyArtist,
    args.royaltyBasis
  );
  console.log("Waiting for block verifications...");
  await MACT6340Contract.deploymentTransaction().wait(15);
  let contractAddress = await MACT6340Contract.getAddress();
  console.log(`Contract deployed to ${contractAddress}`);
  // verify
  if (
    // we are on a live testnet and have the correct api key
    (network.config.chainId === 80001 && process.env.POLYGONSCAN_API_KEY) ||
    (network.config.chainId === 80002 && process.env.ETHERSCAN_API_KEY) ||
    (network.config.chainId === 1115511 && process.env.ETHERSCAN_API_KEY)
  ) {
    console.log("Verifying...");
    await verify(contractAddress, [
      args.mint_price,
      args.max_tokens,
      args.base_uri,
      args.royaltyArtist,
      args.royaltyBasis,
    ]);
    console.log("Completed.");
  } else {
    console.log("No verification available for hardhat network.");
  }
  // mint 3
  const ipfs = [
   // "https://ipfs.io/ipfs/12D3KooWD314neAfbdpdasMrR5MVFXg6q6mnHXj2seaKoGnKE6xo",
  //  "https://ipfs.io/ipfs/QmQnABgoMhgP1t1gyopTS4EmsaPUZ6dwufpq1QWBZg4RyD",
  //  "https://ipfs.io/ipfs/QmfKLqTkMSNiC3Kc7unLctWkJREWFv4gF8Cknhkdej3snb",
  ];
  console.log("Minting 3 tokens...");
  for (let i = 0; i < 3; i++) {
    const transactionResponse = await MACT6340Contract.mintTo(ipfs[i], {
      value: args.mint_price,
    });
    await transactionResponse.wait(3);
    console.log(`Token ${i + 1} completed.`);
  }
}

async function verify(contractAddress, args) {
  console.log("verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("Already verified");
    } else {
      console.log(err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
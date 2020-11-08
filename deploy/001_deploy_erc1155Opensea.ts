import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

require('dotenv').config()

const RINKEBY = "4";
const fs = require('fs');
const rfs = require('recursive-fs');

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const GITHUB = "github";
  const PINATA = "pinata";
  const metadata_location = process.env.METADATA_LOCATION; //  github, pinata

  const {deployer} = await getNamedAccounts();
  const network = await hre.getChainId();
 
  const TEMP_METADATA_DIR = './temp_metadata';
  const GIST_URL_PREFIX = "http://gist.github.com/raw/"

  let gistId;
  let contractUri;
  let baseMetadataUri;
  let contractName;
  let contractSymbol;

  // OpenSea proxy registry addresses for rinkeby and mainnet.
  let proxyRegistryAddress;
  if (network === RINKEBY) {
    proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
  } else {
    proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";
  }

  // GIT - get the contract parameters
  switch (metadata_location) {
    case GITHUB:
      {
        let {files, dirs} = await rfs.read(TEMP_METADATA_DIR);
      
        // on clean run, dirs[1] should contain the directory
        gistId = dirs[1].split(TEMP_METADATA_DIR).pop().split("/")[1];
        console.log("found metadata on github gist: " + gistId);
    
        // set the uris
        contractUri = GIST_URL_PREFIX + gistId;
        baseMetadataUri = contractUri + "/";
    
        // files[0] should contain the contract uri file, read it and get the name and symbol
        const data = JSON.parse(fs.readFileSync(files[0]).toString())
        contractName = data.name;
        contractSymbol = data.symbol;
      }
    break;
  case PINATA:
      {
        const erc1155config = require('../temp_metadata/erc1155config.json');
        const contractconfig = require('../temp_metadata/contracturi.json')
        baseMetadataUri = erc1155config.gatewayUrl + "/" + erc1155config.metadataHash + "/";
        contractUri = erc1155config.gatewayUrl + "/" + erc1155config.contractUriHash;
        contractName = contractconfig.name;
        contractSymbol = contractconfig.symbol;
      }
      break;
  }

  console.log("------")
  console.log("metadata_location: " + metadata_location);
  console.log("Deployer: " + deployer);
  console.log("network: " + network);
  console.log("uri: " + contractUri);
  console.log("name: " + contractName);
  console.log("symbol: " + contractSymbol);
  console.log("------")

  await deploy('ERC1155Opensea', {
    from: deployer,
    args: [
      proxyRegistryAddress,
      contractUri,
      baseMetadataUri,
      contractName,
      contractSymbol
    ],
    log: true
  });
};

export default func;
func.tags = ['ERC1155Opensea'];
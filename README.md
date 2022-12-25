# Moraswap Subgraphs

Subgraph for Moraswap on Neon EVM.


### Deploy

```` 
# authenticate api key
$ graph auth https://api.thegraph.com/deploy/ <API_KEY>

# build constants
$ cd packages/constants
$ yarn prepare:neon

# build subgraph
$ cd ../../subgraphs/exchange
$ yarn prepare:neon
$ yarn codegen:neon
$ yarn build:neon

# deploy subgraph
$ cd ../..
$ yarn deploy:neon
````


### (MORASWAP-SUBGRAPH README)
Aims to deliver analytics & historical data for Moraswap. Still a work in progress. Feel free to contribute!

The Graph exposes a GraphQL endpoint to query the events and entities within the Moraswap ecosytem.

Current subgraph locations:

1. **Exchange**: Includes all Moraswap Exchange data with Price Data, Volume, Users, etc: https://thegraph.com/hosted-service/subgraph/moraswap/exchange

2. **Master Chef**: Indexes all MasterChef staking data: https://thegraph.com/hosted-service/subgraph/moraswap/masterchef

3. **Mora Maker**: Indexes the MoraMaker contract, that handles the serving of exchange fees to the xMora: https://thegraph.com/hosted-service/subgraph/moraswap/maker

5. **xMora**: Indexes the xMora, includes data related to the bar: https://thegraph.com/hosted-service/subgraph/moraswap/xmora

6. **Dexcandles**: https://thegraph.com/hosted-service/subgraph/moraswap/dexcandles

## To setup and deploy

For any of the subgraphs:

1. Run the `yarn run codegen:[subgraph]` command to prepare the TypeScript sources for the GraphQL (generated/schema) and the ABIs (generated/[ABI]/\*)
2. [Optional] run the `yarn run build:[subgraph]` command to build the subgraph. Can be used to check compile errors before deploying.
3. Run `graph auth https://api.thegraph.com/deploy/ <ACCESS_TOKEN>`
4. Deploy via `yarn run deploy:[subgraph]`.

## To setup local graph-node

1. Install docker on local machine https://docs.docker.com/get-docker/)
2. Run `yarn start:node` 
3. Build constants: `cd packages/constants && yarn prepare:devnet`
4. Build subgraph: `cd subgraphs/exchange && yarn prepare:devnet && yarn codegen:devnet && yarn build:devnet`
5. Create local subgraph: `cd subgraphs/exchange && yarn create-local && yarn deploy-local`
6. Subgraph endpoint available at http://localhost:8000/subgraphs/name/moraswap/exchange-devnet 





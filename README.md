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





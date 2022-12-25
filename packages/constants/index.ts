import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

// consts
export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')

export const BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')

export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export const BIG_INT_ONE = BigInt.fromI32(1)

export const BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400)

export const BIG_INT_ZERO = BigInt.fromI32(0)

export const BIG_INT_1E12 = BigInt.fromString('1000000000000')

export const BIG_INT_1E10 = BigInt.fromString('10000000000')

export const BIG_INT_1E9 = BigInt.fromString('1000000000')

export const BIG_INT_1E6 = BigInt.fromString('1000000')

export const LOCKUP_POOL_NUMBER = BigInt.fromI32(29)

export const NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

// EXCHANGE
export const FACTORY_ADDRESS = Address.fromString('0x696d73D7262223724d60B2ce9d6e20fc31DfC56B')
export const MORASWAP_START_BLOCK = BigInt.fromI32(177662201)

export const MORA_TOKEN_ADDRESS = Address.fromString('0x6dcDD1620Ce77B595E6490701416f6Dbf20D2f67')

// MASTER CHEF
export const MASTER_CHEF_ADDRESS = Address.fromString('0xca9Eb9ae2296fc087Af89D70088c8D64e95BB66d')

export const MASTER_CHEF_START_BLOCK = BigInt.fromI32(177663080)

// BAR
export const MORA_BAR_ADDRESS = Address.fromString('0x549b5cb2D324F901aEd6938a3838fB9b10898441')

// MAKER
export const MORA_MAKER_ADDRESS = Address.fromString('0xD3184C8aAc4dcB76Fc382077143d0c6b851F2253')

// PRICING
export const MORASWAP_WNEON_USDC_PAIR_ADDRESS = Address.fromString('0x0641D698D15426385c6a10b2Ebc407058c9E72fC')
export const MORA_USDC_PAIR_ADDRESS = Address.fromString('0x9D9Da7589D8061495140192E0A7361564dAb25C5')

export const WNEON_ADDRESS = Address.fromString('0xf1041596da0499c3438e3B1Eb7b95354C6Aed1f5')
export const USDT_ADDRESS = Address.fromString('0xAA24A5A5E273EFAa64a960B28de6E27B87FfDFfc')
export const USDC_ADDRESS = Address.fromString('0x6Ab1F83c0429A1322D7ECDFdDf54CE6D179d911f')
export const WBTC_ADDRESS = Address.fromString('0x07A274154D79C23d5cd7ba78a243645E419CDd46')

export const WNEON_STABLE_PAIRS: string[] = [
    '0x129399072D8B834b6F4C541F907E0ca20AD09944', // WNEON-USDT
    '0x255D2C600B3ba8475622d2ae15890B3542213737', // WNEON-DAI
    '0x0641D698D15426385c6a10b2Ebc407058c9E72fC', // WNEON-USDC
]

export const WHITELIST: string[] = [
    '0xf1041596da0499c3438e3B1Eb7b95354C6Aed1f5', // WNEON
    '0x90306D9492eB658e47A64Ef834e76c81A0242598', // WETH
    '0x07A274154D79C23d5cd7ba78a243645E419CDd46', // WBTC
    '0xAA24A5A5E273EFAa64a960B28de6E27B87FfDFfc', // USDT
    '0x4954cd6230C19e63B7c7b131760Ef0C0c424321C', // DAI
    '0x6Ab1F83c0429A1322D7ECDFdDf54CE6D179d911f', // USDC
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity providers for price to get tracked
export const MINIMUM_LIQUIDITY_PROVIDERS = BigInt.fromString('5')

// MasterChef precision
export const ACC_MORA_PRECISION = BigInt.fromString('1000000000000')

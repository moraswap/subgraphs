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
export const FACTORY_ADDRESS = Address.fromString('{{ factory_address }}')
export const MORASWAP_START_BLOCK = BigInt.fromI32({{ moraswap_start_block }})

export const MORA_TOKEN_ADDRESS = Address.fromString('{{ mora_token_address }}')

// MASTER CHEF
export const MASTER_CHEF_ADDRESS = Address.fromString('{{ masterchef_address }}')

export const MASTER_CHEF_START_BLOCK = BigInt.fromI32({{ master_chef_start_block }})

// BAR
export const MORA_BAR_ADDRESS = Address.fromString('{{ xmora_address }}')

// MAKER
export const MORA_MAKER_ADDRESS = Address.fromString('{{ mora_maker_address }}')

// PRICING
export const MORASWAP_WNEON_USDC_PAIR_ADDRESS = Address.fromString('{{ wneon_usdc_pair_address }}')
export const MORA_USDC_PAIR_ADDRESS = Address.fromString('{{ mora_usdc_pair_address }}')

export const WNEON_ADDRESS = Address.fromString('{{ wneon_address }}')
export const USDT_ADDRESS = Address.fromString('{{ usdt_address }}')
export const USDC_ADDRESS = Address.fromString('{{ usdc_address }}')
export const WBTC_ADDRESS = Address.fromString('{{ wbtc_address }}')

export const WNEON_STABLE_PAIRS: string[] = [
    '{{ wneon_usdt_pair_address }}', // WNEON-USDT
    '{{ wneon_dai_pair_address }}', // WNEON-DAI
    '{{ wneon_usdc_pair_address }}', // WNEON-USDC
]

export const WHITELIST: string[] = [
    '{{ wneon_address }}', // WNEON
    '{{ weth_address }}', // WETH
    '{{ wbtc_address }}', // WBTC
    '{{ usdt_address }}', // USDT
    '{{ dai_address }}', // DAI
    '{{ usdc_address }}', // USDC
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('{{ min_usd_threshold_new_pairs }}')

// minimum liquidity providers for price to get tracked
export const MINIMUM_LIQUIDITY_PROVIDERS = BigInt.fromString('{{ min_liquidity_providers }}')

// MasterChef precision
export const ACC_MORA_PRECISION = BigInt.fromString('1000000000000')

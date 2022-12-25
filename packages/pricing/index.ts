import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E6,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  BIG_INT_ZERO,
  FACTORY_ADDRESS,
  MORA_TOKEN_ADDRESS,
  MORA_USDC_PAIR_ADDRESS,
  MORASWAP_START_BLOCK,
  MORASWAP_WNEON_USDC_PAIR_ADDRESS,
  USDC_ADDRESS,
  WNEON_ADDRESS,
} from 'const'
import { Address, BigDecimal, BigInt, ethereum, log } from '@graphprotocol/graph-ts'

import { Factory as FactoryContract } from 'exchange/generated/Factory/Factory'
import { Pair as PairContract } from 'exchange/generated/Factory/Pair'

export function getUSDRate(token: Address, block: ethereum.Block): BigDecimal {
  if (token == USDC_ADDRESS) {
    return BIG_DECIMAL_ONE
  }

  if (block.number.le(MORASWAP_START_BLOCK)) {
    return BIG_DECIMAL_ZERO
  }

  let address = MORASWAP_WNEON_USDC_PAIR_ADDRESS

  const tokenPriceNEON = getNeonRate(token, block)

  const pair = PairContract.bind(address)

  const reservesResult = pair.try_getReserves()
  if (reservesResult.reverted) {
    log.info('[getUSDRate] getReserves reverted', [])
    return BIG_DECIMAL_ZERO
  }
  const reserves = reservesResult.value

  const reserve0 = reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18)

  const reserve1 = reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18)

  const neonPriceUSD = reserve1.div(reserve0).div(BIG_DECIMAL_1E6).times(BIG_DECIMAL_1E18)

  return neonPriceUSD.times(tokenPriceNEON)
}

export function getNeonRate(token: Address, block: ethereum.Block): BigDecimal {
  if (token == WNEON_ADDRESS) {
    return BIG_DECIMAL_ONE
  }

  // TODO: add fallback, e.g. pangolin
  //    block.number.le(BigInt.fromI32(10829344)) ? UNISWAP_FACTORY_ADDRESS : FACTORY_ADDRESS
  if (block.number.le(MORASWAP_START_BLOCK)) {
    return BIG_DECIMAL_ZERO
  }
  const factory = FactoryContract.bind(FACTORY_ADDRESS)

  const address = factory.getPair(token, WNEON_ADDRESS)

  if (address == ADDRESS_ZERO) {
    log.info('Address ZERO...', [])
    return BIG_DECIMAL_ZERO
  }

  const pair = PairContract.bind(address)

  const reservesResult = pair.try_getReserves()
  if (reservesResult.reverted) {
    log.info('[getNeonRate] getReserves reverted', [])
    return BIG_DECIMAL_ZERO
  }
  const reserves = reservesResult.value

  // avoid div by 0
  if (reserves.value0.equals(BIG_INT_ZERO) || reserves.value1.equals(BIG_INT_ZERO)) {
    return BIG_DECIMAL_ZERO
  }

  let neon =
    pair.token0() == WNEON_ADDRESS
      ? reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value1.toBigDecimal())
      : reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal())

  return neon.div(BIG_DECIMAL_1E18)
}

// NOTE: currently using pricing via MORA/USDC while exchange subgraph is based on MORA/NEON
// this results in some small discrepancy in MORA price, and therefore moraHarvestedUSD
// we live with this data point has no impact to front end experience, only analytics
export function getMoraPrice(block: ethereum.Block): BigDecimal {
  if (block.number.lt(MORASWAP_START_BLOCK)) {
    return BIG_DECIMAL_ZERO
  }
  // TODO: fallback on token price
  //    if (block.number.lt(SOME_BLOCK)) {
  //        return getUSDRate(MORA_TOKEN_ADDRESS, block)
  //    }

  // TODO: fallback on e.g. pangolin
  //    if (block.number.le(SOME_BLOCK)) {
  //        pair = PairContract.bind(SOME_ADDRESS)
  //    }
  const pair = PairContract.bind(MORA_USDC_PAIR_ADDRESS)

  const reservesResult = pair.try_getReserves()
  if (reservesResult.reverted) {
    log.info('[getMoraPrice] getReserves reverted', [])
    return BIG_DECIMAL_ZERO
  }
  const reserves = reservesResult.value
  if (reserves.value0.toBigDecimal().equals(BigDecimal.fromString('0'))) {
    log.error('[getMoraPrice] USDC reserve 0', [])
    return BIG_DECIMAL_ZERO
  }
  return reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal()).div(BIG_DECIMAL_1E6)
}

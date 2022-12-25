import {
  ADDRESS_ZERO,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  FACTORY_ADDRESS,
  WHITELIST,
  MORA_USDC_PAIR_ADDRESS,
  WNEON_STABLE_PAIRS,
  WNEON_ADDRESS,
  USDC_ADDRESS,
  MORA_TOKEN_ADDRESS,
  MORASWAP_START_BLOCK,
} from 'const'
import { Address, BigDecimal, ethereum, log } from '@graphprotocol/graph-ts'
import { Pair, Token } from '../../generated/schema'

import { Factory as FactoryContract } from '../../generated/Factory/Factory'

export const factoryContract = FactoryContract.bind(FACTORY_ADDRESS)

/*
 * Base MORA price using MORA/NEON * NEON. 
 * WAvg price would be better, but MORA/NEON is bulk of liquidity. 
 */
export function getMoraPrice(block: ethereum.Block = null): BigDecimal {
  const neon_rate = getNeonRate(MORA_TOKEN_ADDRESS)
  const neon_price = getNeonPrice()
  const price = neon_rate.times(neon_price)
  return price
}

/*
 * MORA price is the weighted average of MORA/NEON * NEON and MORA/USDC.
 *
 */
export function getWavgMoraPrice(block: ethereum.Block = null): BigDecimal {
  // get MORA/USDC
  const usdc_pair = Pair.load(MORA_USDC_PAIR_ADDRESS.toString())
  const usdc_price = usdc_pair
    ? usdc_pair.token0 == MORA_TOKEN_ADDRESS.toHexString()
      ? usdc_pair.token1Price
      : usdc_pair.token0Price
    : BIG_DECIMAL_ZERO
  const usdc_weight = usdc_pair
    ? usdc_pair.token0 == MORA_TOKEN_ADDRESS.toHexString()
      ? usdc_pair.reserve0
      : usdc_pair.reserve1
    : BIG_DECIMAL_ZERO

  // get MORA/NEON
  const mora_wneon_address = factoryContract.getPair(MORA_TOKEN_ADDRESS, WNEON_ADDRESS)
  const neon_pair = Pair.load(mora_wneon_address.toString())
  const neon_rate = neon_pair
    ? neon_pair.token0 == MORA_TOKEN_ADDRESS.toHexString()
      ? neon_pair.token1Price
      : neon_pair.token0Price
    : BIG_DECIMAL_ZERO
  const neon_weight = neon_pair
    ? neon_pair.token0 == MORA_TOKEN_ADDRESS.toHexString()
      ? neon_pair.reserve0
      : neon_pair.reserve1
    : BIG_DECIMAL_ZERO
  const neon_price = neon_rate.times(getNeonPrice())

  // weighted avg
  const sumprod = usdc_price.times(usdc_weight).plus(neon_price.times(neon_weight))
  const sumweights = usdc_weight.plus(neon_weight)
  const wavg = sumprod.div(sumweights)
  return wavg
}

/*
 * Bundle tracks the price of NEON, it is used to convert from NEON price to USD price.
 * Exchange subgraph only keeps 1 bundle; it is updated during factory sync() event.
 *
 * This is different from getNeonRate which calculates NEON price for token, as it only
 * calculates price in USD for NEON.
 *
 * NEON price is calculated by getting weighted average of stable-coin pairs.
 *
 */
export function getNeonPrice(block: ethereum.Block = null): BigDecimal {
  let total_weight = BIG_DECIMAL_ZERO
  let sum_price = BIG_DECIMAL_ZERO

  for (let i = 0; i < WNEON_STABLE_PAIRS.length; ++i) {
    const pair_address = WNEON_STABLE_PAIRS[i]
    const pair = Pair.load(pair_address)
    const price = _getNeonPrice(pair)
    const weight = _getNeonReserve(pair)

    total_weight = total_weight.plus(weight)
    sum_price = sum_price.plus(price.times(weight))
    log.debug('getNeonPrice, address: {}, price: {}, weight: {}', [pair_address, price.toString(), weight.toString()])
  }

  // div by 0
  const neon_price = total_weight.equals(BIG_DECIMAL_ZERO) ? BIG_DECIMAL_ZERO : sum_price.div(total_weight)
  return neon_price
}

// returns neon price given e.g. neon-usdc or neon-dai pair
function _getNeonPrice(pair: Pair | null): BigDecimal {
  if (pair == null) {
    return BIG_DECIMAL_ZERO
  }
  const neon = pair.token0 == WNEON_ADDRESS.toHexString() ? pair.token1Price : pair.token0Price
  return neon
}

// returns neon reserves given e.g. neon-usdc or neon-dai pair
function _getNeonReserve(pair: Pair | null): BigDecimal {
  if (pair == null) {
    return BIG_DECIMAL_ZERO
  }
  const neon = pair.token0 == WNEON_ADDRESS.toHexString() ? pair.reserve0 : pair.reserve1
  return neon
}

/*
 * Get price of token in Neon.
 * Loop through WHITELIST to get Neon/Token rate.
 */
export function getNeonRate(address: Address): BigDecimal {
  if (address == WNEON_ADDRESS) {
    return BIG_DECIMAL_ONE
  }
  // TODO: This is slow, and this function is called quite often.
  // What could we do to improve this?
  for (let i = 0; i < WHITELIST.length; ++i) {
    // TODO: Cont. This would be a good start, by avoiding multiple calls to getPair...
    const pairAddress = factoryContract.getPair(address, Address.fromString(WHITELIST[i]))

    if (pairAddress != ADDRESS_ZERO) {
      const pair = Pair.load(pairAddress.toHex())
      if (pair.token0 == address.toHexString()) {
        const token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedNEON as BigDecimal) // return token1 per our token * NEON per token 1
      }
      if (pair.token1 == address.toHexString()) {
        const token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedNEON as BigDecimal) // return token0 per our token * NEON per token 0
      }
    }
  }

  return BIG_DECIMAL_ZERO // nothing was found return 0
}

/*
 * Get price of token in USD.
 */
export function getUSDRate(address: Address, block: ethereum.Block = null): BigDecimal {
  if (address == USDC_ADDRESS) {
    return BIG_DECIMAL_ONE
  }

  const neonRate = getNeonRate(address)
  const neonPrice = getNeonPrice()

  return neonRate.times(neonPrice)
}

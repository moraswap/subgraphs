import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Token, TokenDayData } from '../../../generated/schema'

import { BIG_DECIMAL_ZERO } from 'const'
import { getBundle } from '.'

export function getTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  const bundle = getBundle()

  const day = event.block.timestamp.toI32() / 86400

  const date = day * 86400

  const id = token.id.toString().concat('-').concat(BigInt.fromI32(day).toString())

  let tokenDayData = TokenDayData.load(id)

  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(id)
    tokenDayData.date = date
    tokenDayData.token = token.id
    tokenDayData.priceUSD = token.derivedNEON.times(bundle.neonPrice)
    tokenDayData.volume = BIG_DECIMAL_ZERO
    tokenDayData.volumeNEON = BIG_DECIMAL_ZERO
    tokenDayData.volumeUSD = BIG_DECIMAL_ZERO
    tokenDayData.liquidityUSD = BIG_DECIMAL_ZERO
    tokenDayData.txCount = BigInt.fromI32(0)
  }

  return tokenDayData as TokenDayData
}

export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  const bundle = getBundle()

  const tokenDayData = getTokenDayData(token, event)

  tokenDayData.priceUSD = token.derivedNEON.times(bundle.neonPrice)
  tokenDayData.liquidity = token.liquidity
  tokenDayData.liquidityNEON = token.liquidity.times(token.derivedNEON as BigDecimal)
  tokenDayData.liquidityUSD = tokenDayData.liquidityNEON.times(bundle.neonPrice)
  tokenDayData.txCount = tokenDayData.txCount.plus(BigInt.fromI32(1))

  tokenDayData.save()

  return tokenDayData as TokenDayData
}

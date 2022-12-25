import { BigInt, log } from '@graphprotocol/graph-ts'
import { FACTORY_ADDRESS, BIG_DECIMAL_1E18, BIG_INT_ONE } from 'const'
import { getMoraPrice } from '../../../../packages/pricing'
import { getMaker, getServer, getServingDayData } from '../entities'
import { Serving } from '../../generated/schema'
import { Factory as FactoryContract } from '../../generated/MoraMaker/Factory'
import { ERC20 as ERC20Contract } from '../../generated/MoraMaker/ERC20'
import { LogConvertToMORA } from '../../generated/MoraMaker/MoraMaker'

export function handleLogConvert(event: LogConvertToMORA): void {
  log.info('[MoraMaker] Log Convert {} {} {} {} {} {}', [
    event.params.server.toHex(),
    event.params.token0.toHex(),
    event.params.token1.toHex(),
    event.params.amount0.toString(),
    event.params.amount1.toString(),
    event.params.amount.toString(),
  ])

  const maker = getMaker(event.block)
  const server = getServer(event.params.server, event.block)

  const moraAmount = event.params.amount.toBigDecimal().div(BIG_DECIMAL_1E18)
  const moraAmountUSD = moraAmount.times(getMoraPrice(event.block))

  const token0Contract = ERC20Contract.bind(event.params.token0)
  const token0SymbolResult = token0Contract.try_symbol()
  const token0Symbol = token0SymbolResult.reverted ? '' : token0SymbolResult.value
  const token0DecimalsResult = token0Contract.try_decimals()
  const token0Decimals = token0DecimalsResult.reverted ? 1 : token0DecimalsResult.value

  const token1Contract = ERC20Contract.bind(event.params.token1)
  const token1SymbolResult = token1Contract.try_symbol()
  const token1Symbol = token1SymbolResult.reverted ? '' : token1SymbolResult.value
  const token1DecimalsResult = token1Contract.try_decimals()
  const token1Decimals = token1DecimalsResult.reverted ? 1 : token1DecimalsResult.value

  const factoryContract = FactoryContract.bind(FACTORY_ADDRESS)
  const pair = factoryContract.getPair(event.params.token0, event.params.token1)

  const id = pair.toHex().concat('-').concat(event.block.number.toString())
  let serving = new Serving(id)

  serving.maker = maker.id
  serving.server = server.id
  serving.tx = event.transaction.hash
  serving.token0 = event.params.token0
  serving.token1 = event.params.token1
  serving.token0Symbol = token0Symbol
  serving.token1Symbol = token1Symbol
  serving.amount0 = event.params.amount0.toBigDecimal().div(BigInt.fromI32(token0Decimals).toBigDecimal())
  serving.amount1 = event.params.amount1.toBigDecimal().div(BigInt.fromI32(token1Decimals).toBigDecimal())
  serving.moraServed = moraAmount
  serving.moraServedUSD = moraAmountUSD
  serving.block = event.block.number
  serving.timestamp = event.block.timestamp
  serving.save()

  const servingDayData = getServingDayData(event)
  servingDayData.moraServed = servingDayData.moraServed.plus(moraAmount)
  servingDayData.moraServedUSD = servingDayData.moraServedUSD.plus(moraAmountUSD)
  servingDayData.totalServings = servingDayData.totalServings.plus(BIG_INT_ONE)
  servingDayData.save()

  serving.dayData = servingDayData.id
  serving.save()

  maker.moraServed = maker.moraServed.plus(moraAmount)
  maker.moraServedUSD = maker.moraServedUSD.plus(moraAmountUSD)
  maker.totalServings = maker.totalServings.plus(BIG_INT_ONE)
  maker.save()

  server.moraServed = server.moraServed.plus(moraAmount)
  server.moraServedUSD = server.moraServedUSD.plus(moraAmountUSD)
  server.totalServings = server.totalServings.plus(BIG_INT_ONE)
  server.save()
}

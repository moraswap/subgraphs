import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E6,
  BIG_DECIMAL_ZERO,
  BIG_INT_ZERO,
  MORA_BAR_ADDRESS,
  MORA_TOKEN_ADDRESS,
  MORA_USDC_PAIR_ADDRESS,
} from 'const'
import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from '@graphprotocol/graph-ts'
import { Bar, History, User } from '../generated/schema'
import { Bar as BarContract, Transfer as TransferEvent } from '../generated/MoraBar/Bar'

import { Pair as PairContract } from '../generated/MoraBar/Pair'
import { MoraToken as MoraTokenContract } from '../generated/MoraBar/MoraToken'

// TODO: Get averages of multiple mora stablecoin pairs
function getMoraPrice(): BigDecimal {
  const pair = PairContract.bind(MORA_USDC_PAIR_ADDRESS)
  const reservesResult = pair.try_getReserves()
  if (reservesResult.reverted) {
    log.info('[getMoraPrice] getReserves reverted', [])
    return BIG_DECIMAL_ZERO
  }
  const reserves = reservesResult.value
  if (reserves.value0.toBigDecimal().equals(BigDecimal.fromString("0"))) {
    log.error('[getMoraPrice] USDC reserve 0', [])
    return BIG_DECIMAL_ZERO
  }
  return reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal()).div(BIG_DECIMAL_1E6)
}

function createBar(block: ethereum.Block): Bar {
  const contract = BarContract.bind(dataSource.address())
  const bar = new Bar(dataSource.address().toHex())
  bar.decimals = contract.decimals()
  bar.name = contract.name()
  bar.mora = contract.mora()
  bar.symbol = contract.symbol()
  bar.totalSupply = BIG_DECIMAL_ZERO
  bar.moraStaked = BIG_DECIMAL_ZERO
  bar.moraStakedUSD = BIG_DECIMAL_ZERO
  bar.moraHarvested = BIG_DECIMAL_ZERO
  bar.moraHarvestedUSD = BIG_DECIMAL_ZERO
  bar.xMoraMinted = BIG_DECIMAL_ZERO
  bar.xMoraBurned = BIG_DECIMAL_ZERO
  bar.xMoraAge = BIG_DECIMAL_ZERO
  bar.xMoraAgeDestroyed = BIG_DECIMAL_ZERO
  bar.ratio = BIG_DECIMAL_ZERO
  bar.updatedAt = block.timestamp
  bar.save()

  return bar as Bar
}

function getBar(block: ethereum.Block): Bar {
  let bar = Bar.load(dataSource.address().toHex())

  if (bar === null) {
    bar = createBar(block)
  }

  return bar as Bar
}

function createUser(address: Address, block: ethereum.Block): User {
  const user = new User(address.toHex())

  // Set relation to bar
  user.bar = dataSource.address().toHex()

  user.xMora = BIG_DECIMAL_ZERO
  user.xMoraMinted = BIG_DECIMAL_ZERO
  user.xMoraBurned = BIG_DECIMAL_ZERO

  user.moraStaked = BIG_DECIMAL_ZERO
  user.moraStakedUSD = BIG_DECIMAL_ZERO

  user.moraHarvested = BIG_DECIMAL_ZERO
  user.moraHarvestedUSD = BIG_DECIMAL_ZERO

  // In/Out
  user.xMoraOut = BIG_DECIMAL_ZERO
  user.moraOut = BIG_DECIMAL_ZERO
  user.usdOut = BIG_DECIMAL_ZERO

  user.xMoraIn = BIG_DECIMAL_ZERO
  user.moraIn = BIG_DECIMAL_ZERO
  user.usdIn = BIG_DECIMAL_ZERO

  user.xMoraAge = BIG_DECIMAL_ZERO
  user.xMoraAgeDestroyed = BIG_DECIMAL_ZERO

  user.xMoraOffset = BIG_DECIMAL_ZERO
  user.moraOffset = BIG_DECIMAL_ZERO
  user.usdOffset = BIG_DECIMAL_ZERO
  user.updatedAt = block.timestamp

  return user as User
}

function getUser(address: Address, block: ethereum.Block): User {
  let user = User.load(address.toHex())

  if (user === null) {
    user = createUser(address, block)
  }

  return user as User
}

function getHistory(block: ethereum.Block): History {
  const day = block.timestamp.toI32() / 86400

  const id = BigInt.fromI32(day).toString()

  let history = History.load(id)

  if (history === null) {
    const date = day * 86400
    history = new History(id)
    history.date = date
    history.timeframe = 'Day'
    history.moraStaked = BIG_DECIMAL_ZERO
    history.moraStakedUSD = BIG_DECIMAL_ZERO
    history.moraHarvested = BIG_DECIMAL_ZERO
    history.moraHarvestedUSD = BIG_DECIMAL_ZERO
    history.xMoraAge = BIG_DECIMAL_ZERO
    history.xMoraAgeDestroyed = BIG_DECIMAL_ZERO
    history.xMoraMinted = BIG_DECIMAL_ZERO
    history.xMoraBurned = BIG_DECIMAL_ZERO
    history.xMoraSupply = BIG_DECIMAL_ZERO
    history.ratio = BIG_DECIMAL_ZERO
  }

  return history as History
}

export function transfer(event: TransferEvent): void {
  // Convert to BigDecimal with 18 places, 1e18.
  const value = event.params.value.divDecimal(BIG_DECIMAL_1E18)

  // If value is zero, do nothing.
  if (value.equals(BIG_DECIMAL_ZERO)) {
    log.warning('Transfer zero value! Value: {} Tx: {}', [
      event.params.value.toString(),
      event.transaction.hash.toHex(),
    ])
    return
  }

  const bar = getBar(event.block)
  const barContract = BarContract.bind(MORA_BAR_ADDRESS)

  const moraPrice = getMoraPrice()

  bar.totalSupply = barContract.totalSupply().divDecimal(BIG_DECIMAL_1E18)
  bar.moraStaked = MoraTokenContract.bind(MORA_TOKEN_ADDRESS).balanceOf(MORA_BAR_ADDRESS).divDecimal(BIG_DECIMAL_1E18)
  bar.ratio = bar.moraStaked.div(bar.totalSupply)

  const what = value.times(bar.ratio)
  log.debug('moraPrice: {}, bar.ratio: {}, what: {}', [moraPrice.toString(), bar.ratio.toString(), what.toString()])

  // Minted xMora
  if (event.params.from == ADDRESS_ZERO) {
    const user = getUser(event.params.to, event.block)

    log.info('{} minted {} xMora in exchange for {} mora - moraStaked before {} moraStaked after {}', [
      event.params.to.toHex(),
      value.toString(),
      what.toString(),
      user.moraStaked.toString(),
      user.moraStaked.plus(what).toString(),
    ])

    if (user.xMora == BIG_DECIMAL_ZERO) {
      log.info('{} entered the bar', [user.id])
      user.bar = bar.id
    }

    user.xMoraMinted = user.xMoraMinted.plus(value)

    const moraStakedUSD = what.times(moraPrice)

    user.moraStaked = user.moraStaked.plus(what)
    user.moraStakedUSD = user.moraStakedUSD.plus(moraStakedUSD)

    const days = event.block.timestamp.minus(user.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    const xMoraAge = days.times(user.xMora)

    user.xMoraAge = user.xMoraAge.plus(xMoraAge)

    // Update last
    user.xMora = user.xMora.plus(value)

    user.updatedAt = event.block.timestamp

    user.save()

    const barDays = event.block.timestamp.minus(bar.updatedAt).divDecimal(BigDecimal.fromString('86400'))
    const barXMora = bar.xMoraMinted.minus(bar.xMoraBurned)
    bar.xMoraMinted = bar.xMoraMinted.plus(value)
    bar.xMoraAge = bar.xMoraAge.plus(barDays.times(barXMora))
    bar.moraStaked = bar.moraStaked.plus(what)
    bar.moraStakedUSD = bar.moraStakedUSD.plus(moraStakedUSD)
    bar.updatedAt = event.block.timestamp

    const history = getHistory(event.block)
    history.xMoraAge = bar.xMoraAge
    history.xMoraMinted = history.xMoraMinted.plus(value)
    history.xMoraSupply = bar.totalSupply
    history.moraStaked = history.moraStaked.plus(what)
    history.moraStakedUSD = history.moraStakedUSD.plus(moraStakedUSD)
    history.ratio = bar.ratio
    history.save()
  }

  // Burned xMora
  if (event.params.to == ADDRESS_ZERO) {
    log.info('{} burned {} xMora', [event.params.from.toHex(), value.toString()])

    const user = getUser(event.params.from, event.block)

    user.xMoraBurned = user.xMoraBurned.plus(value)

    user.moraHarvested = user.moraHarvested.plus(what)

    const moraHarvestedUSD = what.times(moraPrice)

    user.moraHarvestedUSD = user.moraHarvestedUSD.plus(moraHarvestedUSD)

    const days = event.block.timestamp.minus(user.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    const xMoraAge = days.times(user.xMora)

    user.xMoraAge = user.xMoraAge.plus(xMoraAge)

    const xMoraAgeDestroyed = user.xMoraAge.div(user.xMora).times(value)

    user.xMoraAgeDestroyed = user.xMoraAgeDestroyed.plus(xMoraAgeDestroyed)

    // remove xMoraAge
    user.xMoraAge = user.xMoraAge.minus(xMoraAgeDestroyed)
    // Update xMora last
    user.xMora = user.xMora.minus(value)

    if (user.xMora == BIG_DECIMAL_ZERO) {
      log.info('{} left the bar', [user.id])
      user.bar = null
    }

    user.updatedAt = event.block.timestamp

    user.save()

    const barDays = event.block.timestamp.minus(bar.updatedAt).divDecimal(BigDecimal.fromString('86400'))
    const barXMora = bar.xMoraMinted.minus(bar.xMoraBurned)
    bar.xMoraBurned = bar.xMoraBurned.plus(value)
    bar.xMoraAge = bar.xMoraAge.plus(barDays.times(barXMora)).minus(xMoraAgeDestroyed)
    bar.xMoraAgeDestroyed = bar.xMoraAgeDestroyed.plus(xMoraAgeDestroyed)
    bar.moraHarvested = bar.moraHarvested.plus(what)
    bar.moraHarvestedUSD = bar.moraHarvestedUSD.plus(moraHarvestedUSD)
    bar.updatedAt = event.block.timestamp

    const history = getHistory(event.block)
    history.xMoraSupply = bar.totalSupply
    history.xMoraBurned = history.xMoraBurned.plus(value)
    history.xMoraAge = bar.xMoraAge
    history.xMoraAgeDestroyed = history.xMoraAgeDestroyed.plus(xMoraAgeDestroyed)
    history.moraHarvested = history.moraHarvested.plus(what)
    history.moraHarvestedUSD = history.moraHarvestedUSD.plus(moraHarvestedUSD)
    history.ratio = bar.ratio
    history.save()
  }

  // If transfer from address to address and not known xMora pools.
  if (event.params.from != ADDRESS_ZERO && event.params.to != ADDRESS_ZERO) {
    log.info('transfered {} xMora from {} to {}', [value.toString(), event.params.from.toHex(), event.params.to.toHex()])

    const fromUser = getUser(event.params.from, event.block)

    const fromUserDays = event.block.timestamp.minus(fromUser.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    // Recalc xMora age first
    fromUser.xMoraAge = fromUser.xMoraAge.plus(fromUserDays.times(fromUser.xMora))
    // Calculate xMoraAge being transfered
    const xMoraAgeTranfered = fromUser.xMoraAge.div(fromUser.xMora).times(value)
    // Subtract from xMoraAge
    fromUser.xMoraAge = fromUser.xMoraAge.minus(xMoraAgeTranfered)
    fromUser.updatedAt = event.block.timestamp

    fromUser.xMora = fromUser.xMora.minus(value)
    fromUser.xMoraOut = fromUser.xMoraOut.plus(value)
    fromUser.moraOut = fromUser.moraOut.plus(what)
    fromUser.usdOut = fromUser.usdOut.plus(what.times(moraPrice))

    if (fromUser.xMora == BIG_DECIMAL_ZERO) {
      log.info('{} left the bar by transfer OUT', [fromUser.id])
      fromUser.bar = null
    }

    fromUser.save()

    const toUser = getUser(event.params.to, event.block)

    if (toUser.bar === null) {
      log.info('{} entered the bar by transfer IN', [fromUser.id])
      toUser.bar = bar.id
    }

    // Recalculate xMora age and add incoming xMoraAgeTransfered
    const toUserDays = event.block.timestamp.minus(toUser.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    toUser.xMoraAge = toUser.xMoraAge.plus(toUserDays.times(toUser.xMora)).plus(xMoraAgeTranfered)
    toUser.updatedAt = event.block.timestamp

    toUser.xMora = toUser.xMora.plus(value)
    toUser.xMoraIn = toUser.xMoraIn.plus(value)
    toUser.moraIn = toUser.moraIn.plus(what)
    toUser.usdIn = toUser.usdIn.plus(what.times(moraPrice))

    const difference = toUser.xMoraIn.minus(toUser.xMoraOut).minus(toUser.xMoraOffset)

    // If difference of mora in - mora out - offset > 0, then add on the difference
    // in staked mora based on xMora:Mora ratio at time of reciept.
    if (difference.gt(BIG_DECIMAL_ZERO)) {
      const mora = toUser.moraIn.minus(toUser.moraOut).minus(toUser.moraOffset)
      const usd = toUser.usdIn.minus(toUser.usdOut).minus(toUser.usdOffset)

      log.info('{} recieved a transfer of {} xMora from {}, mora value of transfer is {}', [
        toUser.id,
        value.toString(),
        fromUser.id,
        what.toString(),
      ])

      toUser.moraStaked = toUser.moraStaked.plus(mora)
      toUser.moraStakedUSD = toUser.moraStakedUSD.plus(usd)

      toUser.xMoraOffset = toUser.xMoraOffset.plus(difference)
      toUser.moraOffset = toUser.moraOffset.plus(mora)
      toUser.usdOffset = toUser.usdOffset.plus(usd)
    }

    toUser.save()
  }

  bar.save()
}

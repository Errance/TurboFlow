import type { Market } from '../../data/soccer/types'
import MarketCard from './MarketCard'
import ButtonGroupMarket from './ButtonGroupMarket'
import OddsTableMarket from './OddsTableMarket'
import ScoreGridMarket from './ScoreGridMarket'
import PlayerListMarket from './PlayerListMarket'
import ComboGridMarket from './ComboGridMarket'
import RangeButtonsMarket from './RangeButtonsMarket'

interface Props {
  market: Market
  displayTitle: string
  onSelect: (market: string, selection: string, odds: number) => void
  selectedKey?: string
}

export default function MarketRenderer({ market, displayTitle, onSelect, selectedKey }: Props) {
  let content: React.ReactNode = null

  switch (market.type) {
    case 'buttonGroup':
      content = <ButtonGroupMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'oddsTable':
      content = <OddsTableMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'scoreGrid':
      content = <ScoreGridMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'playerList':
      content = <PlayerListMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'comboGrid':
      content = <ComboGridMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
    case 'rangeButtons':
      content = <RangeButtonsMarket data={market} onSelect={onSelect} selectedKey={selectedKey} />
      break
  }

  return (
    <MarketCard title={displayTitle}>
      {content}
    </MarketCard>
  )
}

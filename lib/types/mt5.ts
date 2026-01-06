export type MT5Deal = {
  ticket: number
  order: number
  time: number
  time_msc?: number

  type: number // MT5 deal type numeric
  entry: number // 0=in, 1=out, 2=balance, etc.

  position_id: number
  volume: number
  price: number
  profit: number
  swap?: number
  commission?: number
  fee?: number

  symbol: string
  comment?: string
  external_id?: string
}

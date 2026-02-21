import { create } from 'zustand'
import type { Forecast, OutcomeModel, EventStatus } from '../types'

interface ForecastState {
  forecasts: Forecast[]
  addForecast: (params: {
    eventId: string
    contractId: string
    eventTitle: string
    contractLabel: string
    side: 'YES' | 'NO'
    price: number
    shares: number
    comment: string
    outcomeModel: OutcomeModel
    eventStatus: EventStatus
  }) => Forecast
  getForecasts: (eventId?: string) => Forecast[]
  getForecastById: (id: string) => Forecast | undefined
}

export const useForecastStore = create<ForecastState>((set, get) => ({
  forecasts: [],

  addForecast: (params) => {
    const forecast: Forecast = {
      id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...params,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ forecasts: [forecast, ...state.forecasts] }))
    return forecast
  },

  getForecasts: (eventId) => {
    const { forecasts } = get()
    if (!eventId) return forecasts
    return forecasts.filter((f) => f.eventId === eventId)
  },

  getForecastById: (id) => {
    return get().forecasts.find((f) => f.id === id)
  },
}))

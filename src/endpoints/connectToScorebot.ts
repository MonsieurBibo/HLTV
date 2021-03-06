import * as io from 'socket.io-client'
import { ScoreboardUpdate } from '../models/ScoreboardUpdate'
import { LogUpdate } from '../models/LogUpdate'
import { fetchPage, generateRandomSuffix } from '../utils/mappers'
import { HLTVConfig } from '../config'

export type ConnectToScorebotParams = {
  id: number
  onScoreboardUpdate?: (data: ScoreboardUpdate, done: () => void) => any
  onLogUpdate?: (data: LogUpdate, done: () => void) => any
  onFullLogUpdate?: (data: unknown, done: () => void) => any
  onConnect?: () => any
  onDisconnect?: () => any
}

export const connectToScorebot = (config: HLTVConfig) => ({
  id,
  onScoreboardUpdate,
  onLogUpdate,
  onFullLogUpdate,
  onConnect,
  onDisconnect
}: ConnectToScorebotParams) => {
  fetchPage(
    `${config.hltvUrl}/matches/${id}/${generateRandomSuffix()}`,
    config.loadPage
  ).then(($) => {
    const url = $('#scoreboardElement')
      .attr('data-scorebot-url')!
      .split(',')
      .pop()!
    const matchId = $('#scoreboardElement').attr('data-scorebot-id')

    const socket = io.connect(url, {
      agent: !config.httpAgent
    })

    const initObject = JSON.stringify({
      token: '',
      listId: matchId
    })

    let reconnected = false

    socket.on('connect', () => {
      const done = () => socket.close()

      if (onConnect) {
        onConnect()
      }

      if (!reconnected) {
        socket.emit('readyForMatch', initObject)
      }

      socket.on('scoreboard', (data) => {
        if (onScoreboardUpdate) {
          onScoreboardUpdate(data, done)
        }
      })

      socket.on('log', (data) => {
        if (onLogUpdate) {
          onLogUpdate(JSON.parse(data), done)
        }
      })

      socket.on('fullLog', (data) => {
        if (onFullLogUpdate) {
          onFullLogUpdate(JSON.parse(data), done)
        }
      })
    })

    socket.on('reconnect', () => {
      reconnected = true
      socket.emit('readyForMatch', initObject)
    })

    socket.on('disconnect', () => {
      if (onDisconnect) {
        onDisconnect()
      }
    })
  })
}

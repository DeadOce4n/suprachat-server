import type { FastifyBaseLogger } from 'fastify'
import { Line, StatefulDecoder, StatefulEncoder } from 'irctokens'
import { Socket } from 'net'

import {
  FORBIDDEN_CHARS,
  IRCD_HOST,
  IRCD_PORT,
  WEBIRC_PASS
} from '@utils/const.js'
import { APIError } from '@utils/error.js'

type RegisterParams = {
  username: string
  email: string
  password: string
}

type VerifyParams = {
  username: string
  code: string
}

export default class IRCClient {
  private userIp: string
  private decoder: StatefulDecoder
  private encoder: StatefulEncoder
  private socket: Socket
  private logger: FastifyBaseLogger

  constructor(userIp: string, logger: FastifyBaseLogger) {
    this.userIp = userIp.startsWith(':') ? `0${userIp}` : userIp
    this.decoder = new StatefulDecoder()
    this.encoder = new StatefulEncoder()
    this.socket = new Socket()
    this.logger = logger
  }

  private sendLine(line: Line) {
    try {
      this.logger.debug(`IRCd Outgoing Msg: ${line.format()}`)
      this.encoder.push(line)
      const pending = this.encoder.pending()
      this.socket.write(pending)
      this.encoder.pop(pending.length)
    } catch (e) {
      this.socket.emit('error', e)
    }
  }

  private connect(username: string) {
    this.socket.connect({ port: IRCD_PORT, host: IRCD_HOST })
    this.socket.once('connect', () => {
      const connectCommands: ConstructorParameters<typeof Line>[0][] = [
        {
          command: 'WEBIRC',
          params: [WEBIRC_PASS, '*', this.userIp, this.userIp, 'secure']
        },
        {
          command: 'CAP',
          params: ['LS', '302']
        },
        {
          command: 'NICK',
          params: [username]
        },
        {
          command: 'USER',
          params: [username, '*', '*', username]
        }
      ]
      connectCommands.forEach((command) => {
        this.sendLine(new Line(command))
      })
    })
  }

  private disconnect() {
    this.sendLine(new Line({ command: 'QUIT', params: [] }))
    this.socket.end()
  }

  public register({ username, email, password }: RegisterParams) {
    return new Promise<void>((resolve, reject) => {
      this.connect(username)
      this.socket.on('error', (error) => {
        this.disconnect()
        reject(error)
      })
      this.socket.on('data', (data) => {
        const lines = this.decoder.push(Uint8Array.from(data))
        if (lines) {
          lines.forEach((line) => {
            this.logger.debug(`IRCd Incoming Msg: ${line.format()}`)
            if (line.command === 'PING') {
              this.sendLine(new Line({ command: 'PONG', params: [] }))
            } else if (line.command === 'ERROR' || line.command === 'FAIL') {
              this.socket.emit(
                'error',
                new APIError('registrationError', line.params.at(-1))
              )
            } else if (line.command === 'CAP' && !line.params.includes('ACK')) {
              if (
                line.params.some((param) =>
                  param.includes('draft/account-registration')
                )
              ) {
                this.sendLine(
                  new Line({
                    command: 'CAP',
                    params: ['REQ', 'draft/account-registration']
                  })
                )
              }
            } else if (line.command === 'CAP' && line.params.includes('ACK')) {
              this.sendLine(
                new Line({
                  command: 'REGISTER',
                  params: ['*', email, password]
                })
              )
              this.sendLine(new Line({ command: 'CAP', params: ['END'] }))
            } else if (line.command === '001') {
              this.disconnect()
              resolve()
            }
          })
        }
      })
    })
  }

  public verify({ username, code }: VerifyParams) {
    return new Promise<void>((resolve, reject) => {
      this.connect(username)
      this.socket.on('error', (error) => {
        this.disconnect()
        reject(error)
      })
      this.socket.on('data', (data) => {
        const lines = this.decoder.push(Uint8Array.from(data))
        if (lines) {
          lines.forEach((line) => {
            this.logger.debug(`IRCd Incoming Msg: ${line.format()}`)
            if (line.command === 'PING') {
              this.sendLine(new Line({ command: 'PONG', params: [] }))
            } else if (line.command === 'ERROR' || line.command === 'FAIL') {
              this.socket.emit(
                'error',
                new APIError('verificationError', line.params.at(-1))
              )
            } else if (
              line.command === 'VERIFY' &&
              line.params.includes('SUCCESS')
            ) {
              this.disconnect()
              resolve()
            }
          })
        }
      })
      this.sendLine(new Line({ command: 'VERIFY', params: [username, code] }))
    })
  }

  public static verifyNick(
    nick: string
  ): [hasForbiddenChars: boolean, forbiddenChars: string[]] {
    const forbiddenChars = nick
      .split('')
      .filter((char) => FORBIDDEN_CHARS.includes(char))
    return [forbiddenChars.length > 0, forbiddenChars]
  }
}

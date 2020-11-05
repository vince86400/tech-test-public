import * as https from 'https'
import { runInThisContext } from 'vm'
import { request } from './http'

export interface KeycloakRealmConfig {
  realmURL: string
  realmName: string
  serviceAccountId: string
  serviceAccountSecret: string
}

export interface KeycloakServiceAccountLoginResponse {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  refresh_token: string
  token_type: string
  'not-before-policy': number
  session_state: string
  scope: string
}

export class KeycloakServiceAccountResponseError extends Error {}

export class KeycloakServiceAccountCredentials {
  static fromResponse(response: KeycloakServiceAccountLoginResponse): KeycloakServiceAccountCredentials {
    return new KeycloakServiceAccountCredentials(response.access_token)
  }

  constructor(private accessToken: string) {}

  getToken(): string {
    return this.accessToken
  }
}

export class KeycloakRealmClient {
  constructor(private config: KeycloakRealmConfig) {}

  async loginAsServiceAccount(): Promise<KeycloakServiceAccountCredentials> {
    const opts: https.RequestOptions = {
      protocol: 'https:',
      hostname: this.config.realmURL,
      path: `/auth/realms/${this.config.realmName}/protocol/openid-connect/token`,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: this.basicAuth,
      },
    }
    const reqBody = 'grant_type=client_credentials'

    const response = (await request(opts, reqBody)) as KeycloakServiceAccountLoginResponse
    return KeycloakServiceAccountCredentials.fromResponse(response)
  }

  get basicAuth() {
    return (
      'Basic ' + Buffer.from(`${this.config.serviceAccountId}:${this.config.serviceAccountSecret}`).toString('base64')
    )
  }
}


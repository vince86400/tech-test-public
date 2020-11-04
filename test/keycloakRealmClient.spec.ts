import { expect } from 'chai'
import * as nock from 'nock'
import { KeycloakRealmClient, KeycloakRealmConfig } from '../src'

describe('KeycloakRealmClient', () => {
  const config: KeycloakRealmConfig = {
    realmURL: 'keycloak.shrd.sparklecore.net',
    realmName: '86400-non-prod-app',
    serviceAccountId: 'account-id',
    serviceAccountSecret: '123456789abcde',
  }
  const client: KeycloakRealmClient = new KeycloakRealmClient(config)
  const reqBody = 'grant_type=client_credentials'
  const hostname = config.realmURL
  const path = `/auth/realms/${config.realmName}/protocol/openid-connect/token`
  const protocol = 'https:'
  const resHeaders = {
    'content-type': 'application/json',
  }

  beforeEach('Set up', () => {
    nock.disableNetConnect()
  })

  afterEach('Clean up', () => {
    if (!nock.isDone()) {
      throw new Error('Not all nock interceptors were used!')
    }
    nock.cleanAll()
  })

  it('Should retrieve the access token from keycloak successfully', async () => {
    const keycloakRes = {
      access_token: 'access-token',
      expires_in: 600,
      refresh_expires_in: 600,
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      'not-before-policy': 0,
      session_state: 'uuid-1234',
      scope: 'profile email',
    }

    nock(`${protocol}//${hostname}`).post(path, reqBody).once().reply(200, keycloakRes, resHeaders)

    const resp = await client.loginAsServiceAccount()
    expect(resp.getToken()).to.equal(keycloakRes.access_token)
  })
})

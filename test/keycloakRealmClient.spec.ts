import { expect } from 'chai'
import * as nock from 'nock'
import { KeycloakRealmClient, KeycloakRealmConfig, KeycloakServiceAccountResponseError } from '../src'

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

  const keycloakValidResponse = {
    access_token: 'access-token',
    expires_in: 600,
    refresh_expires_in: 600,
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    'not-before-policy': 0,
    session_state: 'uuid-1234',
    scope: 'profile email',
  }

  beforeEach('Set up', () => {
    nock.disableNetConnect()
  })

  afterEach('Clean up', () => {
    nock.cleanAll()
  })

  it('Should retrieve the access token from keycloak successfully', async () => {
    nock(`${protocol}//${hostname}`).post(path, reqBody).once().reply(200, keycloakValidResponse, resHeaders)

    const resp = await client.loginAsServiceAccount()
    expect(resp.getToken()).to.equal(keycloakValidResponse.access_token)
  })

  it('Should fail if keycloak returns error', async () => {
    const status = 'error'
    const response = { status }
    nock(`${protocol}//${hostname}`).post(path, reqBody).once().reply(500, response, resHeaders)

    await expect(client.loginAsServiceAccount()).to.eventually.be.rejected.and.have.property('status', status)
  })

  it('Should fail if there is undefined, null or empty config values', async () => {
    const badConfig = {
      realmURL: undefined,
      realmName: null,
      serviceAccountId: '',
      serviceAccountSecret: ''
    }
    const client: KeycloakRealmClient = new KeycloakRealmClient(badConfig)
    nock(`${protocol}//localhost`).post(`/auth/realms/${badConfig.realmName}/protocol/openid-connect/token`, reqBody).once().reply(200, keycloakValidResponse, resHeaders)
    await expect(client.loginAsServiceAccount()).to.eventually
      .be.rejectedWith('Missing or incorrect config')
      .and.be.an.instanceof(Error)
  })

  it('Should fail if keycloak does not return an access_token and a valid expires_in response', async () => {
    const badKeycloakResponse = {
      access_token: ''
    }
    nock(`${protocol}//${hostname}`).post(path, reqBody).once().reply(200, badKeycloakResponse, resHeaders)
    await expect(client.loginAsServiceAccount()).to.eventually
      .be.rejectedWith('Either access token or expiry was invalid in response from keycloak')
      .and.be.an.instanceof(KeycloakServiceAccountResponseError)
      .and.have.property('errorCode', 'KEYCLOAK_SERVICE_ACCOUNT_INVALID_CREDENTIALS')
  })
})

import { expect } from 'chai'
import { request } from '../src/http'
import * as nock from 'nock'

describe('HTTP', () => {
  const protocol = 'https:'
  const hostname = 'www.abc.com'
  const port = 443
  const path = '/api'
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

  it('should do a GET request successfully', async () => {
    const status = 'success'
    const response = { status }
    nock(`${protocol}//${hostname}`).get(path).once().reply(200, response, resHeaders)

    const resp = await request({
      hostname,
      path,
      port,
      protocol,
      method: 'GET',
    })
    expect(resp).to.deep.equal(response)
  })

  it('should do a POST request successfully', async () => {
    const status = 'success'
    const response = { status }
    const reqBody = { request: 'ok' }
    nock(`${protocol}//${hostname}`).post(path, reqBody).once().reply(200, response, resHeaders)

    const resp = await request(
      {
        hostname,
        path,
        port,
        protocol,
        method: 'POST',
      },
      JSON.stringify(reqBody)
    )
    expect(resp).to.deep.equal(response)
  })

  it('should reject on unsupported content type', async () => {
    const body = 'invalid content type'
    const headers = {
      'content-type': 'text/html; charset=ISO-8859-1',
    }
    nock(`${protocol}//${hostname}`).get(path).once().reply(200, body, headers)

    const req = request({
      hostname,
      path,
      port,
      protocol,
      method: 'GET',
    })

    await expect(req).to.eventually.be.rejectedWith('Unsupported content type')
  })

  it('should reject on SERVER ERROR 5xx', async () => {
    const status = 'error'
    const response = { status }
    nock(`${protocol}//${hostname}`).get(path).once().reply(500, response, resHeaders)

    const req = request({
      hostname,
      path,
      port,
      protocol,
      method: 'GET',
    })

    await expect(req).to.eventually.be.rejected.and.have.property('status', status)
  })

  it('should reject on BAD REQUEST 4xx', async () => {
    const status = 'invalid'
    const response = { status }
    nock(`${protocol}//${hostname}`).get(path).once().reply(400, response, resHeaders)

    const req = request({
      hostname,
      path,
      port,
      protocol,
      method: 'GET',
    })

    await expect(req).to.eventually.be.rejected.and.have.property('status', status)
  })

  it('should reject on request timeout', async () => {
    const status = 'success'
    const response = { status }
    nock(`${protocol}//${hostname}`).get(path).once().delay(2000).reply(200, response)

    const req = request({
      hostname,
      path,
      port,
      protocol,
      method: 'GET',
      timeout: 1999,
    })

    await expect(req).to.eventually.be.rejectedWith('Request timed out or conn reset')
  })
})

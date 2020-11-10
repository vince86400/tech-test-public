import * as https from 'https'

export const DEFAULT_TIMEOUT_IN_MILLS = 25000

export async function request(options: https.RequestOptions, reqData?: any) {
  var reqOpts = { timeout: DEFAULT_TIMEOUT_IN_MILLS, ...options }
  if (reqOpts.method === 'POST' || reqOpts.method === 'PUT' || reqOpts.method === 'PATCH') {
    reqOpts.headers = {
      'content-type': 'application/json',
      'content-length': reqData.length,
      ...reqOpts.headers,
    }
  }

  return new Promise((resolve, reject) => {
    var req = https.request(reqOpts, (resp) => {
      var data = ''
      var contentType = resp.headers['content-type']
      if (!contentType.startsWith('application/json')) {
        return reject(new Error('Unsupported content type'))
      }

      resp.on('data', (chunk) => {
        data += chunk
      })
      resp.on('end', () => {
        var respData = JSON.parse(data)
        return resolve(respData)
      })
    })

    req.on('error', (err: Error & { code: string }) => {
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        err.message = 'Request timed out or conn reset'
      }
      return reject(err)
    })
    req.on('timeout', () => {
      req.abort()
    })

    if (reqOpts.method === 'POST' || reqOpts.method === 'PUT' || reqOpts.method === 'PATCH') {
      req.write(reqData)
    }
    req.end()
  })
}

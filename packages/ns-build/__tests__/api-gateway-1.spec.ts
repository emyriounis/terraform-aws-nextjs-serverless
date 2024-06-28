import { setupConfig } from './util'
setupConfig()
import { exportedForTests } from '../server'

describe('api-gateway 1.0', () => {
  describe('when headers', () => {
    // Comes from https://michaelbrewer.github.io/aws-lambda-events/http-api/#request-stucture-format-10
    const event = {
      version: '1.0',
      path: '/my/path',
      headers: {
        host: 'r3pmxmplak.execute-api.us-east-2.amazonaws.com',
        'x-amzn-trace-id': 'Root=1-5e6722a7-cc56xmpl46db7ae02d4da47e',
        'x-forwarded-for': '205.255.255.176',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      },
    }
    test('converts path and headers correctly', () => {
      const res = exportedForTests.parseEvent(event)
      expect(res.path).toBe('/my/path')
      expect(res.rawPath).toBe('/my/path')
      expect(res.headers.host).toBe('r3pmxmplak.execute-api.us-east-2.amazonaws.com')
      expect(res.headers.referer).toBe('https://r3pmxmplak.execute-api.us-east-2.amazonaws.com:443')
    })
  })
  describe('when multiValueHeaders', () => {
    const event = {
      version: '1.0',
      path: '/some/path',
      multiValueHeaders: {
        host: ['host1'],
        'x-amzn-trace-id': ['Root=1-5e6722a7-cc56xmpl46db7ae02d4da47e'],
        'x-forwarded-for': ['205.255.255.176'],
        'x-forwarded-host': ['host2'],
        'x-forwarded-port': ['443'],
        'x-forwarded-proto': ['https'],
      },
    }
    test('converts path and headers correctly', () => {
      const res = exportedForTests.parseEvent(event)
      expect(res.path).toBe('/some/path')
      expect(res.rawPath).toBe('/some/path')
      expect(res.headers.host).toBe('host2')
      expect(res.headers.referer).toBe('https://host2:443')
    })
  })
})

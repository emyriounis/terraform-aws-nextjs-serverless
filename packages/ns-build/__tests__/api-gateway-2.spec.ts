import { setupConfig, ServerSetup } from './util'

let server: ServerSetup | null = null
beforeAll(() => {
  server = setupConfig()
})
afterAll(() => {
  server && server.cleanup()
})


describe('api-gateway 2.0', () => {

  describe('when simple event', () => {
    const event = {
      version: '2.0',
      rawPath: '/some/path',
      headers: {
        host: 'host1',
        'x-amzn-trace-id': 'Root=1-5e6722a7-cc56xmpl46db7ae02d4da47e',
        'x-forwarded-for': '205.255.255.176',
        'x-forwarded-host': 'host2',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      },
    }
    test('converts path and headers correctly', () => {
      const res = server?.exportedForTests.parseEvent(event)
      expect(res.path).toBe('/some/path')
      expect(res.rawPath).toBe('/some/path')
      expect(res.headers.host).toBe('host2')
      expect(res.headers.referer).toBe('https://host2')
    })
  })

  describe('when example event', () => {
    // Comes from https://github.com/awsdocs/aws-lambda-developer-guide/blob/main/sample-apps/nodejs-apig/event-v2.json
    const event = {
      version: '2.0',
      rawPath: '/default/nodejs-apig-function-1G3XMPLZXVXYI',
      headers: {
        host: 'r3pmxmplak.execute-api.us-east-2.amazonaws.com',
        'x-amzn-trace-id': 'Root=1-5e6722a7-cc56xmpl46db7ae02d4da47e',
        'x-forwarded-for': '205.255.255.176',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      },
    }
    test('handles path correctly', () => {
      const res = server?.exportedForTests.parseEvent(event)
      expect(res.path).toBe('/default/nodejs-apig-function-1G3XMPLZXVXYI')
    })
    test('handles rawPath correctly', () => {
      const res = server?.exportedForTests.parseEvent(event)
      expect(res.rawPath).toBe('/default/nodejs-apig-function-1G3XMPLZXVXYI')
    })
    test('handles headers.host correctly', () => {
      const res = server?.exportedForTests.parseEvent(event)
      expect(res.headers.host).toBe('r3pmxmplak.execute-api.us-east-2.amazonaws.com')
    })
    test('handles headers.referer correctly', () => {
      const res = server?.exportedForTests.parseEvent(event)
      expect(res.headers.referer).toBe('https://r3pmxmplak.execute-api.us-east-2.amazonaws.com')
    })
  })
})

import { NextConfig } from 'next'
import NextServer from 'next/dist/server/next-server'
import serverless from 'serverless-http'
// @ts-ignore
import { config } from './.next/required-server-files.json'

const showDebugLogs = process.env.SHOW_DEBUG_LOGS === 'true'
const overrideHostHeader = process.env.OVERRIDE_HOST_HEADER === 'true'

const useCustomServerSidePropsHandler = (path: string) =>
  process.env.DEFAULT_SS_PROPS_HANDLER !== 'true' &&
  path.includes('/_next/data/')

const getProps = async (event: any, context: any) => {
  const path =
    './.next/server/pages/' +
    event.rawPath
      .replace('/_next/data/', '')
      .split('/')
      .slice(1)
      .join('/')
      .replace('.json', '.js')
  showDebugLogs && console.log({ path });

  const { getServerSideProps } = require(path)

  const customResponse = await getServerSideProps(context)
  showDebugLogs && console.log({ customResponse });

  const response: any = {}
  response.statusCode = 200
  response.body = JSON.stringify({ pageProps: customResponse.props })
  showDebugLogs && console.log({ response });

  return response
}

const nextServer = new NextServer({
  hostname: 'localhost',
  port: 3000,
  dir: './',
  dev: false,
  conf: {
    ...(config as NextConfig),
  },
  customServer: true,
})

const main = serverless(nextServer.getRequestHandler(), {
  binary: ['*/*'],
  provider: 'aws',
})

export const handler = (event: any, context: any) => {
  showDebugLogs && console.debug({ event }, JSON.parse(event?.queryStringParameters?.cf_event)?.request?.headers?.host?.value)
  showDebugLogs && console.debug({ context })

  if (overrideHostHeader) {
    const customDomainHost = JSON.parse(event?.queryStringParameters?.cf_event)?.request?.headers?.host?.value
    event.headers.host = customDomainHost
  }

  return useCustomServerSidePropsHandler(event.rawPath)
    ? getProps(event, context)
    : main(event, context)
}

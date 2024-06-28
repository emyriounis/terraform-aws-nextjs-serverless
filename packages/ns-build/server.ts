import { NextConfig } from 'next'
import NextServer from 'next/dist/server/next-server'
import serverless from 'serverless-http'
// @ts-ignore
import { config } from './.next/required-server-files.json'

const imageTypes = process.env.CUSTOM_IMAGE_TYPES?.split(',') ?? ['webp', 'jpeg', 'jpg', 'png', 'gif', 'ico', 'svg']

const showDebugLogs = process.env.SHOW_DEBUG_LOGS === 'true'

// Check if the custom server-side props handler should be used.
const useCustomServerSidePropsHandler = (path: string) =>
  process.env.DEFAULT_SS_PROPS_HANDLER !== 'true' &&
  path.includes('/_next/data/')

// Modify the event object to match the one expected by Next.JS
const parseEvent = (event: any) => {
  event.path = event.rawPath || event.path
  event.rawPath = event.path
  event.headers = event.headers || {}
  
  let host = event.headers['x-forwarded-host'] || event.headers.host
  if (event.multiValueHeaders && event.multiValueHeaders['x-forwarded-host'] && event.multiValueHeaders['x-forwarded-host'].length > 0) {
    host = event.multiValueHeaders['x-forwarded-host'][0]
    event.multiValueHeaders.host = [host]
  }
  event.headers.host = host

  let proto = event.headers['x-forwarded-proto']
  if (event.multiValueHeaders && event.multiValueHeaders['x-forwarded-proto'] && event.multiValueHeaders['x-forwarded-proto'].length > 0) {
    proto = event.multiValueHeaders['x-forwarded-proto'][0]
  }

  let port = event.headers['x-forwarded-port'] || ''
  if (event.multiValueHeaders && event.multiValueHeaders['x-forwarded-port'] && event.multiValueHeaders['x-forwarded-port'].length > 0) {
    port = event.multiValueHeaders['x-forwarded-port'][0] || ''
  }
  if (port) {
    port = ':' + port
  }
  event.headers.referer = proto + '://' + host + port
  return event
}

/**
 * Dynamically load server-side rendering logic based on the
 * requested URL path and returns the page props in a JSON response.
 * @param {any} event - An object that contains information
 * related to the incoming request triggering this function.
 * @returns Returns a response object with a status code of 200 and a body
 * containing the `pageProps` extracted from the custom response obtained by calling the
 * `getServerSideProps` function dynamically based on the requested URL path. The `pageProps` are
 * serialized into a JSON string before being returned.
 */
const getProps = async (event: any) => {
  const resolvedUrl = event.rawPath.replace('/_next/data/', '')
  const path =
    './.next/server/pages/' +
    resolvedUrl.split('/').slice(1).join('/').replace('.json', '.js')
  showDebugLogs && console.log({ path })

  /**
   * Dynamically import the module from the specified path and
   * extracts the `getServerSideProps` function from that module to load
   * the server-side rendering logic dynamically based on the requested URL path.
   */
  const { getServerSideProps } = require(path)

  // Provide a custom server-side rendering context for the server-side rendering.
  const customSsrContext = {
    req: event,
    query: event.rawQueryString,
    resolvedUrl,
  }
  const customResponse = await getServerSideProps(customSsrContext)
  showDebugLogs && console.log({ customResponse })

  const response: any = {}
  response.statusCode = 200
  response.body = JSON.stringify({ pageProps: customResponse.props })
  response.headers = {
    'Cache-Control': 'no-store',
  }
  showDebugLogs && console.log({ response })

  return response
}

// Creating the Next.js Server
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

// Creating the serverless wrapper using the `serverless-http` library.
const main = serverless(nextServer.getRequestHandler(), {
  binary: ['*/*'],
  provider: 'aws',
})

/**
 * The handler function processes an event, checks if an image is requested, and either redirects to an
 * S3 bucket or calls another function based on custom server-side props.
 * @param {any} event - The `event` parameter typically contains information about the HTTP request
 * that triggered the Lambda function. This can include details such as headers, query parameters, path
 * parameters, request body, and more. In your code snippet, the `event` object is being used to
 * extract information like the path and headers of
 * @param {any} context - The `context` parameter in the code snippet you provided is typically used to
 * provide information about the execution environment and runtime context of the function. It can
 * include details such as the AWS Lambda function name, version, memory limit, request ID, and more.
 * This information can be useful for understanding the context
 * @param {any} callback - The `callback` parameter in the `handler` function is a function that you
 * can call to send a response back to the caller. In this case, the response is an HTTP response
 * object that includes a status code and headers. When you call `callback(null, response)`, you are
 * indicating that
 * @returns The code is returning either the result of the `getProps(parsedEvent)` function if
 * `useCustomServerSidePropsHandler(parsedEvent.rawPath)` returns true, or the result of the
 * `main(parsedEvent, context)` function if `useCustomServerSidePropsHandler(parsedEvent.rawPath)`
 * returns false.
 */
export const handler = (event: any, context: any, callback: any) => {
  showDebugLogs && console.debug({ event })
  showDebugLogs && console.debug({ context })

  const parsedEvent = parseEvent(event)
  showDebugLogs && console.debug({ parsedEvent })

  /* If an image is requested, redirect to the corresponding S3 bucket. */
  if (imageTypes.some(type => parsedEvent.path.includes('.' + type))) {
    const response = {
      statusCode: 301,
      headers: {
        Location: event.headers.referer + '/assets' + event.path,
      },
    }

    return callback(null, response)
  }

  return useCustomServerSidePropsHandler(parsedEvent.rawPath)
    ? getProps(parsedEvent)
    : main(parsedEvent, context)
}

export const exportedForTests = {
  parseEvent,
}

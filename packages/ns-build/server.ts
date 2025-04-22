import fs from 'fs'
import path from 'path'
import { NextConfig } from 'next'
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from 'aws-lambda'
import NextServer from 'next/dist/server/next-server'
import serverless from 'serverless-http'
// @ts-ignore
import { config } from './.next/required-server-files.json'

type ParsedEvent = APIGatewayProxyEventV2 & { path: string }

const imageTypes = process.env.CUSTOM_IMAGE_TYPES?.split(',') ?? [
  'webp',
  'jpeg',
  'jpg',
  'png',
  'gif',
  'ico',
  'svg',
]

const showDebugLogs = process.env.SHOW_DEBUG_LOGS === 'true'

// Check if the custom server-side props handler should be used.
const useCustomServerSidePropsHandler = (path: string) =>
  process.env.DEFAULT_SS_PROPS_HANDLER !== 'true' &&
  path.includes('/_next/data/')

const parseCookies = (cookies: string[] = []) => {
  const parsedCookies: Record<string, string> = {}

  for (const cookie of cookies) {
    const parts = cookie.split(';')

    for (const part of parts) {
      const [key, value] = part.split('=')

      if (key && value) {
        parsedCookies[key.trim()] = decodeURIComponent(value.trim())
      }
    }
  }

  return parsedCookies
}

// Modify the event object to match the one expected by Next.JS
const parseEvent = (event: APIGatewayProxyEventV2): ParsedEvent => {
  const parsedEvent: ParsedEvent = Object.assign(event)

  parsedEvent.path = parsedEvent.rawPath
  parsedEvent.headers.host = parsedEvent.headers['x-forwarded-host']

  return parsedEvent
}

// Convert route file path to regex
const routeToRegex = (filePath: string) => {
  const relativePath = filePath
    .replace('.next/server/pages', '')
    .replace(/\.js$/, '')
  const regexPattern = relativePath
    .replace(/\/\[\[\.\.\.(\w+)\]\]/g, '(?:/(.*))?') // Handle [[...param]] correctly (no extra slash)
    .replace(/\[\.\.\.(\w+)\]/g, '/(.*)') // Handle [...param]
    .replace(/\/?\[(\w+)\]/g, '/([^/]+)') // Handle [param]

  return {
    regex: new RegExp('^' + regexPattern + '$'),
    paramNames: [
      ...relativePath.matchAll(/\[\[?\.\.\.(\w+)\]\]?|\[(\w+)\]/g),
    ].map(m => m[1] || m[2]),
    filePath,
  }
}

const depth = (path: string) => path.split('/').length // Count path depth
const dynamicCount = (path: string) =>
  (path.match(/\[([^\]]+)\]/g) || []).length // Count dynamic segments
const isCatchAll = (path: string) => path.includes('[...')
const isOptionalCatchAll = (path: string) => path.includes('[[...')

const compareRoutes = (a: string, b: string) => {
  // 1. Sort by absolute path depth (more nested = higher priority)
  const depthDiff = depth(b) - depth(a) // Reverse order (deeper first)
  if (depthDiff !== 0) return depthDiff

  // 2. Fewer dynamic segments take priority
  const dynamicDiff = dynamicCount(a) - dynamicCount(b)
  if (dynamicDiff !== 0) return dynamicDiff

  // 3. Catch-all `[...param]` has lower priority than `[param]`
  const aCatchAll = isCatchAll(a)
  const bCatchAll = isCatchAll(b)
  if (aCatchAll !== bCatchAll) return aCatchAll ? 1 : -1

  // 4. Optional catch-all `[[...param]]` has the lowest priority
  const aOptionalCatchAll = isOptionalCatchAll(a)
  const bOptionalCatchAll = isOptionalCatchAll(b)
  if (aOptionalCatchAll !== bOptionalCatchAll) return aOptionalCatchAll ? 1 : -1

  return 0 // Same priority
}

// Get all Next.js dynamic routes
const getAllNextRoutes = () => {
  const dir = './.next/server/pages'
  const allFiles: string[] = []

  function traverse(subdir: string) {
    fs.readdirSync(subdir, { withFileTypes: true }).forEach(file => {
      const fullPath = path.join(subdir, file.name)

      if (file.isDirectory()) {
        traverse(fullPath)
      } else if (fullPath.endsWith('.js') && fullPath.includes('[')) {
        allFiles.push(fullPath)
      }
    })
  }

  traverse(dir)

  return allFiles.sort((a, b) => compareRoutes(a, b)).map(routeToRegex)
}

// Match a request path to a known Next.js dynamic route
const matchRoute = (requestPath: string) => {
  const routes = getAllNextRoutes()
  showDebugLogs && console.debug('Discovered routes:', getAllNextRoutes())

  for (const { regex, paramNames, filePath } of routes) {
    showDebugLogs && console.debug({ requestPath, regex, paramNames, filePath })
    const match = requestPath.match(regex)
    if (match) {
      const params = paramNames.reduce((acc, param, i) => {
        const value = match[i + 1] ? match[i + 1].split('/') : undefined

        if (value && value.length === 1) {
          acc[param] = value[0]
        }

        return acc
      }, {} as Record<string, string | string[] | undefined>)

      return { filePath, params }
    }
  }
  return null
}

// Load getServerSideProps with fallback to dynamic routes
const loadProps = async (importPath: string) => {
  try {
    const { getServerSideProps } = await require(importPath)
    return { getServerSideProps }
  } catch (err) {
    showDebugLogs &&
      console.debug(
        `Failed to directly load ${importPath}, trying dynamic route match...`,
        err
      )
    // Extract the request path from the import path
    const requestPath = importPath
      .replace('./.next/server/pages', '')
      .replace(/\.js$/, '')
    // Try to match the request path dynamically
    const matchedRoute = matchRoute(requestPath)
    if (matchedRoute) {
      try {
        showDebugLogs &&
          console.debug(`Matched dynamic route: ${matchedRoute.filePath}`, {
            params: matchedRoute.params,
          })
        const { getServerSideProps } = await require(matchedRoute.filePath)
        return { getServerSideProps, params: matchedRoute.params }
      } catch (fallbackErr) {
        showDebugLogs &&
          console.debug(
            `Fallback failed for ${matchedRoute.filePath}`,
            fallbackErr
          )
      }
    }

    showDebugLogs &&
      console.debug(`Failed to match dynamic route for ${requestPath}`)
    return { getServerSideProps: null }
  }
}

/**
 * Dynamically load server-side rendering logic based on the
 * requested URL path and returns the page props in a JSON response.
 * @param {ParsedEvent} event - An object that contains information
 * related to the incoming request triggering this function.
 * @returns Returns a response object with a status code of 200 and a body
 * containing the `pageProps` extracted from the custom response obtained by calling the
 * `getServerSideProps` function dynamically based on the requested URL path. The `pageProps` are
 * serialized into a JSON string before being returned.
 */
const getProps = async (event: ParsedEvent) => {
  const routePath =
    '/' +
    event.rawPath
      .replace('/_next/data/', '')
      .split('/')
      .slice(1)
      .join('/')
      .replace('.json', '')
  const path = './.next/server/pages' + routePath + '.js'
  const resolvedUrl = routePath.replace('/index', '/')
  showDebugLogs && console.debug({ routePath, path, resolvedUrl })

  /*
   * Dynamically import the module from the specified path and
   * extracts the `getServerSideProps` function from that module to load
   * the server-side rendering logic dynamically based on the requested URL path.
   */
  const { getServerSideProps, params } = await loadProps(path)
  if (getServerSideProps === null) {
    return {
      statusCode: 500,
      body: JSON.stringify({ notFound: true }),
    }
  }

  // Provide a custom server-side rendering context for the server-side rendering.
  const customSsrContext = {
    req: event,
    query: event.queryStringParameters ?? {},
    params,
    resolvedUrl,
  }
  showDebugLogs && console.debug({ customSsrContext })

  const customResponse = await getServerSideProps(customSsrContext)
  showDebugLogs && console.debug({ customResponse })

  const redirectDestination = customResponse.redirect?.destination
  showDebugLogs && console.debug({ redirectDestination })
  // TODO: fix this
  if (redirectDestination) {
    return {
      statusCode: 500,
      body: JSON.stringify({ notFound: true }),
    }
  }

  const body = JSON.stringify(
    redirectDestination
      ? { __N_REDIRECT: redirectDestination, __N_SSP: true }
      : { pageProps: customResponse.props, __N_SSP: true }
  )

  const response: APIGatewayProxyResultV2 = {}
  response.statusCode = 200
  response.body = body
  response.headers = {
    'Cache-Control': 'no-store',
  }
  showDebugLogs && console.debug({ response })

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
 * @param {APIGatewayProxyEventV2} event - The `event` parameter typically contains information about the HTTP request
 * that triggered the Lambda function. This can include details such as headers, query parameters, path
 * parameters, request body, and more. In your code snippet, the `event` object is being used to
 * extract information like the path and headers of
 * @param {Context} context - The `context` parameter in the code snippet you provided is typically used to
 * provide information about the execution environment and runtime context of the function. It can
 * include details such as the AWS Lambda function name, version, memory limit, request ID, and more.
 * This information can be useful for understanding the context
 * @param {Callback} callback - The `callback` parameter in the `handler` function is a function that you
 * can call to send a response back to the caller. In this case, the response is an HTTP response
 * object that includes a status code and headers. When you call `callback(null, response)`, you are
 * indicating that
 * @returns The code is returning either the result of the `getProps(parsedEvent)` function if
 * `useCustomServerSidePropsHandler(parsedEvent.rawPath)` returns true, or the result of the
 * `main(parsedEvent, context)` function if `useCustomServerSidePropsHandler(parsedEvent.rawPath)`
 * returns false.
 */
export const handler = (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback
) => {
  showDebugLogs && console.debug({ event })
  showDebugLogs && console.debug({ context })

  const parsedEvent = parseEvent(event)
  showDebugLogs && console.debug({ parsedEvent })

  /* If an image is requested, redirect to the corresponding S3 bucket. */
  if (imageTypes.some(type => parsedEvent.path.includes('.' + type))) {
    const response = {
      statusCode: 302,
      headers: {
        Location:
          'https://' + parsedEvent.headers.host + '/assets' + parsedEvent.path,
      },
    }

    return callback(null, response)
  }

  const shouldUseCustomServerSidePropsHandler = useCustomServerSidePropsHandler(
    parsedEvent.rawPath
  )
  if (shouldUseCustomServerSidePropsHandler) {
    const rawCookies = event.cookies
    Object.defineProperty(parsedEvent, 'cookies', {
      get: () => parseCookies(rawCookies),
    })
    showDebugLogs && console.debug({ parsedEvent })

    return getProps(parsedEvent)
  }

  return main(parsedEvent, context)
}

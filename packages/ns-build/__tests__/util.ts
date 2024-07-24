import fs from 'fs'
import path from 'path'
import { NextConfig } from 'next'
import { RoutesManifest } from 'next/dist/build'

// From https://github.com/vercel/next.js/blob/canary/packages/next/src/build/index.ts
// Note that Next does not export this.
interface RequiredServerFilesManifest {
  version?: number
  config?: NextConfig
  appDir?: string
  relativeAppDir?: string
  files?: string[]
  ignore?: string[]
}

// Input options to the setup.
export interface Options {
  requiredServerFiles?: RequiredServerFilesManifest
  buildId?: string
  font?: {
    pages: any
    app: any
    appUsingSizeAdjust: boolean
    pagesUsingSizeAdjust: boolean
  }
  prerender?: any
  pages?: any
  routes?: RoutesManifest
}

// Default options to the setup.
const defaultOptions: Options = {
  requiredServerFiles: {
    version: 1,
    config: {
      env: {},
      distDir: '.next',
      experimental: {},
      amp: {},
      publicRuntimeConfig: {},
    } as NextConfig,
    appDir: '.',
    files: [],
    ignore: [],
  },
  buildId: 'F',
  font: {
    pages:{},
    app:{},
    appUsingSizeAdjust:false,
    pagesUsingSizeAdjust:false,
  },
  prerender: {},
  pages: {},
  routes: {
    version: 3,
    pages404: false,
    caseSensitive: false,
    basePath: "",
    redirects: [],
    headers: [],
    dynamicRoutes: [],
    staticRoutes: [],
    dataRoutes: [],
    rsc: {
        header: "RSC",
        varyHeader: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url",
        prefetchHeader: "Next-Router-Prefetch",
        didPostponeHeader: "x-nextjs-postponed",
        suffix: ".rsc",
        prefetchSuffix: ".prefetch.rsc",
    },
    rewrites: [],
  },
}

// Simple, recursive directory creation function.
const mkDirs = (dirName: string) => {
  if (dirName.length <= 0) {
    return
  }
  if (!fs.existsSync(dirName)) {
    mkDirs(path.dirname(dirName))
    fs.mkdirSync(dirName)
  }
}

// Simple helper to write a file with content.
const writeFile = (filename: string, content: string) => {
  mkDirs(path.dirname(filename))
  fs.writeFileSync(filename, content)
}

// Exported data for the tests.
export interface ServerSetup {
  // The lambda entrypoint function
  handler(event: any, context: any, callback: any): Promise<any>
  // The non-public facing things used for testing.
  exportedForTests: {
    useCustomServerSidePropsHandler(path: string): boolean
    parseEvent(event: any): any
    getProps(event: any): Promise<any>
  }
  // Called in the after* function to clean up the generated temporary files.
  cleanup(): void
}

/**
 * Set up the files required by the Next.JS server setup.
 * @param options Options for setting the constructed next.js directory.
 * @returns {
 *  server: server.js module,
 *  exportedForTests: the 'exportedForTests' constants from the server.js module.
 *  cleanup: callback to clean up the created temporary directory.
 * }
 */
export const setupConfig = (options?: Options): ServerSetup => {
  const requiredServerFiles = {
    ...defaultOptions.requiredServerFiles,
    ...options?.requiredServerFiles,
    config: {
      ...defaultOptions.requiredServerFiles?.config,
      ...options?.requiredServerFiles?.config,
    }
  }
  const buildId = options?.buildId || defaultOptions.buildId || 'F'
  const font = {
    ...defaultOptions.font,
    ...options?.font,
  }
  const prerender = options?.prerender || defaultOptions.prerender || {}
  const pages = options?.pages || defaultOptions.pages || {}
  const routes = {
    ...defaultOptions.routes,
    ...options?.routes,
  }

  const basePath = path.resolve(__dirname, '..')
  const nextDir = path.resolve(basePath, '.next');

  try {
    // Create the files required by next.js, to mock-up a built application.
    // This happens directly in the source location, so this has a risk of polluting the
    // source directory.  It also means tests cannot run in parallel.
    // While it's possible to construct this environment in a temporary directory, it has
    // the unfortunate consequence of requiring this setup to also copy the server.js/ts
    // files into the temporary directory, which makes debugging drastically more difficult.
    writeFile(path.resolve(nextDir, 'required-server-files.json'), JSON.stringify(requiredServerFiles))
    writeFile(path.resolve(nextDir, 'BUILD_ID'), buildId)
    writeFile(path.resolve(nextDir, 'server', 'next-font-manifest.json'), JSON.stringify(font))
    writeFile(path.resolve(nextDir, 'prerender-manifest.json'), JSON.stringify(prerender))
    writeFile(path.resolve(nextDir, 'server/pages-manifest.json'), JSON.stringify(pages))
    writeFile(path.resolve(nextDir, 'routes-manifest.json'), JSON.stringify(routes))

    // Load the code-under-test.
    const server = require('../server')

    return {
      handler: server.handler,
      exportedForTests: server.exportedForTests,
      cleanup: () => {
        fs.rmSync(nextDir, { recursive: true, force: true })
      },
    }
  } catch (e) {
    // Error during setup.  Clean up the partially constructed directory.
    fs.rmSync(nextDir, { recursive: true, force: true })
    throw e
  }
}

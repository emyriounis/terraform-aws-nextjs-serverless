import fs from 'fs'
import path from 'path'
import { NextConfig } from 'next'

const mkDirs = (dirName: string) => {
  if (dirName.length <= 0) {
    return
  }
  if (!fs.existsSync(dirName)) {
    mkDirs(path.dirname(dirName))
    fs.mkdirSync(dirName)
  }
}

const writeFile = (filename: string, content: string) => {
  mkDirs(path.dirname(filename))
  fs.writeFileSync(filename, content)
}

// Set up the files required by the Next.JS server setup.
export const setupConfig = () => {
  const outDir = path.resolve(__dirname, '..', '.next')

  writeFile(path.resolve(outDir, 'required-server-files.json'), JSON.stringify({
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
  }))

  writeFile(path.resolve(outDir, 'BUILD_ID'), 'F')

  writeFile(path.resolve(outDir, 'server', 'next-font-manifest.json'), JSON.stringify({
    pages:{},
    app:{},
    appUsingSizeAdjust:false,
    pagesUsingSizeAdjust:false,
  }))

  writeFile(path.resolve(outDir, 'prerender-manifest.json'), JSON.stringify({
  }))

  writeFile(path.resolve(outDir, 'server/pages-manifest.json'), JSON.stringify({
  }))

  writeFile(path.resolve(outDir, 'routes-manifest.json'), JSON.stringify({
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
        varyHeader: "RSC, Next-Router-State-Tree, Next-Router-Prefetch",
        prefetchHeader: "Next-Router-Prefetch",
        didPostponeHeader: "x-nextjs-postponed",
        contentTypeHeader: "text/x-component",
        suffix: ".rsc",
        prefetchSuffix: ".prefetch.rsc",
    },
    rewrites: [],
  }))
}

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import sharp from 'sharp'

import { defaults } from './constants'
import { isVersionStored, redirectTo } from './helpers'

/**
 * This TypeScript function is a CloudFront function that resizes and compresses images based on the
 * request URI and returns the resized image as a base64 encoded string.
 * @param {any} event - The `event` parameter is an object that contains information about the event
 * that triggered the Lambda function. In this case, it contains the CloudFront event data, which
 * includes details about the request and configuration.
 * @param {any} _context - The `_context` parameter is a context object that contains information about
 * the execution environment and runtime. It is typically not used in this code snippet, so it can be
 * ignored for now.
 * @param {any} callback - The `callback` parameter is a function that is used to send the response
 * back to the caller. It takes two arguments: an error object (or null if there is no error) and the
 * response object. The response object should contain the status code, status description, headers,
 * body encoding, and
 * @returns The code is returning a response object with the following properties:
 */
export const handler = async (event: any, _context: any, callback: any) => {
  try {
    /* Extract the `request` and `config` properties. */
    const { request, config } = event?.Records?.[0]?.cf
    /* Construct the base URL for the image assets. */
    const baseUrl = `https://${config?.distributionDomainName}/`

    /* The S3 region. */
    const s3Region =
      request?.origin?.custom?.customHeaders?.['s3-region']?.[0]?.value
    /* The public_assets_bucket name. */
    const publicAssetsBucket =
      request?.origin?.custom?.customHeaders?.['public-assets-bucket']?.[0]
        ?.value

    /* Extracting the relevant information from the request URI. */
    const queryString = (request?.uri as string)
      ?.replace('/_next/image/', '')
      ?.split('/')
    // Map required info
    const width = parseInt(queryString?.[0] || defaults.width.toString())
    const type = queryString?.[1]
    const filename = queryString?.slice(2)?.join('/').replace('%2F', '/')

    /* The S3 Client. */
    const s3 = new S3Client({ region: s3Region })
    const resizedImageFilename = `resized-assets/${width}/${type}/${filename}`

    const isVersionAlreadyResized = await isVersionStored(s3, publicAssetsBucket, resizedImageFilename)
    if (isVersionAlreadyResized) {
      return redirectTo(baseUrl + resizedImageFilename, callback)
    }

    // The url where the image is stored
    const imageUrl = baseUrl + 'assets/' + filename
    // The options for image transformation
    const options = { quality: defaults.quality }

    /* Build the s3 command. */
    const s3GetObjectCommand = new GetObjectCommand({
      Bucket: publicAssetsBucket,
      Key: 'assets/' + filename,
    })

    /* The body of the S3 object. */
    const { Body } = await s3.send(s3GetObjectCommand)
    /* Transforming the body of the S3 object into a byte array. */
    const s3Object = await Body.transformToByteArray()

    /* Resize and compress the image. */
    const resizedImage = sharp(s3Object).resize({ width })

    let newContentType: string | null = null
    /* Apply the corresponding image type transformation. */
    switch (type) {
      case 'webp':
        resizedImage.webp(options)
        newContentType = 'image/webp'
        break
      case 'jpeg':
        resizedImage.jpeg(options)
        newContentType = 'image/jpeg'
        break
      case 'png':
        resizedImage.png(options)
        newContentType = 'image/png'
        break
      // case 'gif':
      //   // resizedImage.gif(options)
      //   resizedImage.gif()
      //   newContentType = 'image/gif'
      //   break
      // case 'apng':
      //   // resizedImage.apng(options)
      //   resizedImage.png(options)
      //   newContentType = 'image/apng'
      //   break
      // case 'avif':
      //   resizedImage.avif(options)
      //   newContentType = 'image/avif'
      //   break
      // // case 'svg+xml':
      // //   resizedImage.svg(options)
      // //   newContentType = 'image/svg+xml'
      // //   break

      default:
        return redirectTo(imageUrl, callback)
    }

    /* Converting the resized image into a buffer. */
    const resizedImageBuffer = await resizedImage.toBuffer()
    /* Store the resized image */
    const s3PutObjectCommand = new PutObjectCommand({
      Bucket: publicAssetsBucket,
      Key: resizedImageFilename,
      Body: resizedImageBuffer,
      ContentType: newContentType,
    })
    await s3.send(s3PutObjectCommand)

    return redirectTo(baseUrl + resizedImageFilename, callback)
  } catch (error) {
    console.error('An unexpected occured', error)

    return callback(null, {
      status: 403, // to not leak data
    })
  }
}

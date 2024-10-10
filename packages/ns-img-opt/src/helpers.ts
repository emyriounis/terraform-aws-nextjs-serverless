import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3"

/**
 * The function `redirectTo` is used to create a redirect response with a specified URL.
 * @param {string} url - The `url` parameter is a string that represents the URL to which you want to
 * redirect the user.
 * @param {any} callback - The `callback` parameter is a function that is used to return the response
 * to the caller. It takes two arguments: an error object (if any) and the response object. In this
 * case, the response object is an HTTP response with a status code of 302 (Redirect) and a `
 * @returns a callback function with two arguments: null and an object representing a response.
 */
export const redirectTo = (url: string, callback: any) => {
  const response = {
    status: 302,
    statusDescription: 'Redirect',
    headers: {
      location: [
        {
          key: 'Location',
          value: url,
        },
      ],
      'cache-control': [
        {
          key: 'Cache-Control',
          value: 'public, max-age=600, stale-while-revalidate=2592000', // Serve cached content up to 30 days old while revalidating it after 10 minutes
        },
      ],
    },
  }

  return callback(null, response)
}

export const isVersionStored = async (s3Client: S3Client, bucket: string, key: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    // will throw error if it's not found
    await s3Client.send(command)
    return true
  } catch (error) {
    console.warn(`${key} is not stored yet`, error);
    return false
  }
}

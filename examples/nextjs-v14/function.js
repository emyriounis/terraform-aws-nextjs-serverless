function handler(event) {
  if (
    event.request.querystring &&
    event.request.querystring.cf_event &&
    event.request.querystring.cf_event.value
  ) {
    return event.request
  }

  let url = `https://${event.request.headers.host.value}${event.request.uri}`
  url += `?cf_event=${encodeURIComponent(JSON.stringify(event))}`

  var response = {
    statusCode: 302,
    statusDescription: 'Found',
    headers: {
      'cloudfront-functions': { value: 'generated-by-CloudFront-Functions' },
      location: {
        value: url,
      },
    },
  }
  return response

  // return event.request
}

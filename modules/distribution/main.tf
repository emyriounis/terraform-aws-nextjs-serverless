data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "caching_all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}

####################################
############ lambdas_oai ###########
####################################

resource "aws_cloudfront_origin_access_identity" "dynamic_assets_oai" {
  comment = "dynamic_assets_origin"
}

resource "aws_cloudfront_origin_access_identity" "image_redirection_oai" {
  comment = "image_redirection_origin"
}

resource "aws_cloudfront_origin_access_identity" "image_optimization_oai" {
  comment = "image_optimization_origin"
}

####################################
########### distribution ###########
####################################

resource "aws_cloudfront_function" "viewer_request" {
  name    = "${var.deployment_name}-ssr-viewer-request"
  runtime = "cloudfront-js-2.0"
  comment = "cloudfront function to extract custom domain"
  publish = true
  code    = <<EOF
const imageTypes = ['webp', 'jpeg', 'jpg', 'png', 'gif', 'ico', 'svg'];

function handler(event) {
  const request = event.request;
  const uri = event.request.uri;
  const headers = request.headers;
  const host = request.headers.host.value;

  if (uri && imageTypes.some((type) => uri.includes('.' + type))) {
    const response = {
      statusCode: 302,
      // Don't use `host` as it's not custom domain
      headers: { location: { value: '/assets' + uri } },
    };

    return response;
  }

  headers['x-forwarded-host'] = { value: host };
  return request;
}
EOF
}

resource "aws_cloudfront_cache_policy" "custom_paths_cache" {
  count = var.custom_cache_policy_id == null && length(var.cloudfront_cached_paths.paths) > 0 ? 1 : 0
  name  = "${var.deployment_name}-custom-paths-cache-policy"

  default_ttl = var.cloudfront_cached_paths.default_ttl
  max_ttl     = var.cloudfront_cached_paths.max_ttl
  min_ttl     = var.cloudfront_cached_paths.min_ttl

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["x-forwarded-host"]
      }
    }
    query_strings_config {
      query_string_behavior = "all"
    }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

resource "aws_cloudfront_distribution" "next_distribution" {
  origin {
    domain_name = var.public_assets_bucket.s3_bucket_bucket_regional_domain_name
    origin_id   = var.public_assets_origin_id.id

    s3_origin_config {
      origin_access_identity = var.public_assets_origin_id.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = var.static_assets_bucket.s3_bucket_bucket_regional_domain_name
    origin_id   = var.static_assets_origin_id.id

    s3_origin_config {
      origin_access_identity = var.static_assets_origin_id.cloudfront_access_identity_path
    }
  }

  origin {
    domain_name = var.dynamic_origin_domain_name
    origin_id   = aws_cloudfront_origin_access_identity.dynamic_assets_oai.id

    custom_origin_config {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = "example.com"
    origin_id   = aws_cloudfront_origin_access_identity.image_redirection_oai.id

    custom_origin_config {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "Enable-Image-Optimization"
      value = var.enable_image_optimization ? "true" : "false"
    }
  }

  origin {
    domain_name = "example.com"
    origin_id   = aws_cloudfront_origin_access_identity.image_optimization_oai.id

    custom_origin_config {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "S3-Region"
      value = var.public_assets_bucket_region
    }

    custom_header {
      name  = "Public-Assets-Bucket"
      value = var.public_assets_bucket.s3_bucket_id
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  wait_for_deployment = var.wait_for_distribution_deployment

  aliases             = var.cloudfront_aliases
  default_root_object = null

  ordered_cache_behavior {
    path_pattern     = "/_next/image/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = aws_cloudfront_origin_access_identity.image_optimization_oai.id

    lambda_function_association {
      event_type = "origin-request"
      lambda_arn = var.image_optimization_qualified_arn
    }

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/_next/image*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = aws_cloudfront_origin_access_identity.image_redirection_oai.id

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = var.image_redirection_qualified_arn
      include_body = true
    }

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = var.static_assets_origin_id.id

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = var.public_assets_origin_id.id

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/resized-assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = var.public_assets_origin_id.id

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  dynamic "ordered_cache_behavior" {
    for_each = var.cloudfront_cached_paths.paths
    content {
      path_pattern     = ordered_cache_behavior.value
      allowed_methods  = ["GET", "HEAD", "OPTIONS"]
      cached_methods   = ["GET", "HEAD", "OPTIONS"]
      target_origin_id = aws_cloudfront_origin_access_identity.dynamic_assets_oai.id

      cache_policy_id = var.custom_cache_policy_id != null ? var.custom_cache_policy_id : aws_cloudfront_cache_policy.custom_paths_cache[0].id

      dynamic "function_association" {
        for_each = concat([{ event_type : "viewer-request", function_arn : aws_cloudfront_function.viewer_request.arn }], var.cloudfront_function_associations)
        content {
          event_type   = function_association.value.event_type
          function_arn = function_association.value.function_arn
        }
      }

      viewer_protocol_policy = "redirect-to-https"
      compress               = true
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_cloudfront_origin_access_identity.dynamic_assets_oai.id

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.caching_all_viewer_except_host_header.id

    dynamic "function_association" {
      for_each = concat([{ event_type : "viewer-request", function_arn : aws_cloudfront_function.viewer_request.arn }], var.cloudfront_function_associations)
      content {
        event_type   = function_association.value.event_type
        function_arn = function_association.value.function_arn
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  price_class = var.cloudfront_price_class

  viewer_certificate {
    cloudfront_default_certificate = var.cloudfront_acm_certificate_arn == null
    acm_certificate_arn            = var.cloudfront_acm_certificate_arn
    minimum_protocol_version       = var.cloudfront_acm_certificate_arn == null ? "TLSv1" : "TLSv1.2_2021"
    ssl_support_method             = var.cloudfront_acm_certificate_arn != null ? "sni-only" : null
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

resource "aws_cloudfront_monitoring_subscription" "next_distribution_monitoring" {
  distribution_id = aws_cloudfront_distribution.next_distribution.id

  monitoring_subscription {
    realtime_metrics_subscription_config {
      realtime_metrics_subscription_status = "Enabled"
    }
  }
}

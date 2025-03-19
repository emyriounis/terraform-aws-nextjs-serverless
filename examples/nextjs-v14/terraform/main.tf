resource "aws_cloudfront_function" "test" {
  name    = "test"
  runtime = "cloudfront-js-2.0"
  comment = "my function"
  publish = true
  code    = file("../function.js")
}

module "next_serverless" {
  # source = "../../../"
  source  = "emyriounis/nextjs-serverless/aws"
  version = "1.6.0"

  providers = {
    aws.global_region = aws.global_region
  }

  deployment_name = var.deployment_name
  region          = var.region
  base_dir        = var.base_dir

  cloudfront_acm_certificate_arn = (var.deployment_domain != null) ? module.next_cloudfront_certificate[0].acm_certificate_arn : null
  cloudfront_aliases             = (var.deployment_domain != null) ? [var.deployment_domain] : []

  pre_resize_images                     = true
  wait_for_distribution_deployment      = false
  show_debug_logs                       = true
  use_default_server_side_props_handler = false

  cloudfront_function_associations = [{
    event_type   = "viewer-request"
    function_arn = aws_cloudfront_function.test.arn
  }]

  next_lambda_env_vars = {
    NODE_ENV = "production"
  }
}

module "next_cloudfront_certificate" {
  count = (var.deployment_domain != null) ? 1 : 0

  source  = "terraform-aws-modules/acm/aws"
  version = "4.3.2"

  domain_name = (var.deployment_domain != null) ? var.deployment_domain : null
  zone_id     = (var.deployment_domain != null) ? data.aws_route53_zone.hosted_zone[0].zone_id : null

  providers = {
    aws = aws.global_region
  }
}

data "aws_route53_zone" "hosted_zone" {
  count = (var.hosted_zone != null) ? 1 : 0

  name = var.hosted_zone
}

resource "aws_route53_record" "next_cloudfront_alias" {
  count = (var.deployment_domain != null) ? 1 : 0

  zone_id = data.aws_route53_zone.hosted_zone[0].zone_id
  name    = var.deployment_domain
  type    = "A"

  allow_overwrite = true

  alias {
    name                   = module.next_serverless.cloudfront_url
    zone_id                = module.next_serverless.distribution.next_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

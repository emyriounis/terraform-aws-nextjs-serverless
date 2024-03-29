module "next_serverless" {
  # source = "../../../"
  source  = "emyriounis/nextjs-serverless/aws"
  version = "0.3.1"

  deployment_name = var.deployment_name
  region          = var.region
  base_dir        = var.base_dir

  next_lambda_runtime        = "nodejs20.x"
  image_optimization_runtime = "nodejs20.x"

  cloudfront_acm_certificate_arn = (var.deployment_domain != null) ? module.next_cloudfront_certificate[0].acm_certificate_arn : null
  cloudfront_aliases             = (var.deployment_domain != null) ? [var.deployment_domain] : []

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

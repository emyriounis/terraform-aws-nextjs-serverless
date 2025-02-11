variable "deployment_name" {
  type = string
}

variable "base_dir" {
  type = string
}

variable "enable_image_optimization" {
  type = bool
}

variable "dynamic_origin_domain_name" {
  type = string
}

variable "cloudfront_acm_certificate_arn" {
  type    = string
  default = null
}

variable "cloudfront_price_class" {
  type = string
}

variable "cloudfront_aliases" {
  type = list(string)
}

variable "image_optimization_qualified_arn" {
  type = string
}

variable "image_redirection_qualified_arn" {
  type = string
}

variable "static_assets_bucket" {
  type = map(any)
}

variable "static_assets_origin_id" {
  type = map(any)
}

variable "public_assets_bucket" {
  type = map(any)
}

variable "public_assets_bucket_region" {
  type = string
}

variable "public_assets_origin_id" {
  type = map(any)
}

variable "cloudfront_cached_paths" {
  type = object({
    paths       = list(string)
    min_ttl     = number
    default_ttl = number
    max_ttl     = number
  })
}

variable "cloudfront_cache_default_ttl" {
  type = number
}

variable "cloudfront_cache_max_ttl" {
  type = number
}

variable "cloudfront_cache_min_ttl" {
  type = number
}

variable "cloudfront_function_associations" {
  type = list(object({
    event_type   = string
    function_arn = string
  }))
}

variable "wait_for_distribution_deployment" {
  type = bool
}

output "static-assets-hosting" {
  value       = module.static-assets-hosting
  description = "Resources created by the static-assets-hosting module"
}

output "public-assets-hosting" {
  value       = module.public-assets-hosting
  description = "Resources created by the public-assets-hosting module"
}

output "image-optimization" {
  value       = module.image-optimization
  description = "Resources created by the image-optimization module"
}

output "server-side-rendering" {
  value       = module.server-side-rendering
  description = "Resources created by the server-side-rendering module"
}

output "distribution" {
  value       = var.create_cloudfront_distribution ? module.distribution[0] : {}
  description = "Resources created by the distribution module"
}

output "cloudfront_url" {
  value       = var.create_cloudfront_distribution ? module.distribution[0].next_distribution.domain_name : null
  description = "The URL where cloudfront hosts the distribution"
}

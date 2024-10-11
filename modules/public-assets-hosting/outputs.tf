output "public_assets_bucket" {
  value = module.public_assets_bucket
}

output "public_assets_oai" {
  value = aws_cloudfront_origin_access_identity.public_assets_oai
}

output "all_resized_images_paths" {
  value = local.all_resized_images_paths_map
}

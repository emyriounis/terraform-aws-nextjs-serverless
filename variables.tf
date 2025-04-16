variable "deployment_name" {
  description = "The name that will be used in the resources, must be unique. We recommend to use up to 20 characters"
  type        = string
}

variable "region" {
  description = "The AWS region you wish to deploy your resources (ex. eu-central-1)"
  type        = string
}

variable "base_dir" {
  description = "The base directory of the next.js app"
  type        = string
  default     = "./"
}

variable "cloudfront_acm_certificate_arn" {
  description = "The certificate ARN for the cloudfront_aliases (CloudFront works only with certs stored in us-east-1)"
  type        = string
  default     = null
}

# If you need a wildcard domain(ex: *.example.com), you can add it like this:
# aliases = [var.custom_domain, "*.${var.custom_domain}"]
variable "cloudfront_aliases" {
  description = "A list of custom domain for the cloudfront distribution, e.g. www.my-nextjs-app.com"
  type        = list(string)
  default     = []
}

variable "cloudfront_price_class" {
  description = "Price class for the CloudFront distribution. Options: PriceClass_All, PriceClass_200, PriceClass_100"
  type        = string
  default     = "PriceClass_100"
}

# Example:
# next_lambda_env_vars = {
#   BACKEND_VIRTUAL_DOMAIN    = "backend.example.com"
#   NEXT_PUBLIC_RECAPTCHA_KEY = "recaptcha-key" 
# }
variable "next_lambda_env_vars" {
  description = "Map of environment variables that you want to pass to the lambda"
  type        = map(any)
  default     = {}
}

variable "custom_image_types" {
  description = "List of image file extentions that you store in the public/ directory. Defaults to ('webp', 'jpeg', 'jpg', 'png', 'gif', 'ico', 'svg')"
  type        = list(string)
  default     = ["webp", "jpeg", "jpg", "png", "gif", "ico", "svg"]
}

variable "next_lambda_policy_statements" {
  description = "Map of dynamic policy statements to attach to Lambda Function role"
  type        = map(any)
  default     = {}
}

variable "next_lambda_memory_size" {
  description = "The memory size for the server side rendering Lambda (Set memory to between 128 MB and 10240 MB)"
  type        = number
  default     = 4096
}

variable "next_lambda_runtime" {
  description = "The runtime for the next lambda (nodejs16.x or nodejs20.x)"
  type        = string
  default     = "nodejs20.x"
}

variable "next_lambda_logs_retention" {
  description = "The number of days that cloudwatch logs of next lambda should be retained (Possible values are: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, and 3653)"
  type        = number
  default     = 30
}

variable "next_lambda_ephemeral_storage_size" {
  description = "Amount of ephemeral storage (/tmp) in MB the next lambda can use at runtime. Valid value between 512 MB to 10240 MB"
  type        = number
  default     = 512
}

variable "api_gateway_log_format" {
  description = "Default stage's single line format of the access logs of data, as specified by selected $context variables"
  type        = string
  default     = "sourceIp: $context.identity.sourceIp, $context.domainName $context.requestTime \"$context.httpMethod $context.path $context.routeKey $context.protocol\" path: $context.customDomain.basePathMatched resp_status: $context.status integrationLatency: $context.integrationLatency responseLatency: $context.responseLatency requestId: $context.requestId Error: $context.integrationErrorMessage rawRequestPayloadSize: $input.body.size() rawRequestPayload: $input.body" # https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-logging-variables.html
}

variable "enable_image_optimization" {
  description = "Boolean to disable image optimization feature"
  type        = bool
  default     = true
}

variable "image_optimization_runtime" {
  description = "The runtime for the image optimization Lambdas (nodejs16.x or nodejs20.x)"
  type        = string
  default     = "nodejs20.x"
}

variable "image_optimization_lambda_memory_size" {
  description = "The memory size for the image optimization Lambda (Set memory to between 128 MB and 10240 MB)"
  type        = number
  default     = 2048
}

variable "image_optimization_logs_retention" {
  description = "The number of days that cloudwatch logs of image optimization lambdas should be retained (Possible values are: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, and 3653)"
  type        = number
  default     = 30
}

variable "image_optimization_ephemeral_storage_size" {
  description = "Amount of ephemeral storage (/tmp) in MB the image optimization lambdas can use at runtime. Valid value between 512 MB to 10240 MB"
  type        = number
  default     = 512
}

variable "cloudfront_cached_paths" {
  description = "An object containing a list of paths to cache and min, default and max TTL values"
  type = object({
    paths       = list(string)
    min_ttl     = number
    default_ttl = number
    max_ttl     = number
  })
  default = {
    paths       = []
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }
}

variable "custom_cache_policy_id" {
  description = "The ID of CloudFront cache policy"
  type        = string
  default     = null
}

variable "cloudfront_cache_default_ttl" {
  description = "Default TTL in seconds for ordered cache behaviors"
  type        = number
  default     = 86400
}

variable "cloudfront_cache_max_ttl" {
  description = "Maximum TTL in seconds for ordered cache behaviors"
  type        = number
  default     = 31536000
}

variable "cloudfront_cache_min_ttl" {
  description = "Minimum TTL in seconds for ordered cache behaviors"
  type        = number
  default     = 1
}

variable "cloudfront_function_associations" {
  description = "List of CloudFront functions, to associate them with the defaulf distribution"
  type = list(object({
    event_type   = string
    function_arn = string
  }))
  default = []
}

variable "create_cloudfront_invalidation" {
  description = "Boolean to disable the trigger for cloudfront invalidation after every deployment"
  type        = bool
  default     = true
}

variable "wait_for_distribution_deployment" {
  description = "If enabled, the resource will wait for the distribution status to change from `InProgress` to `Deployed`"
  type        = bool
  default     = true
}

variable "use_default_server_side_props_handler" {
  description = "Boolean to enabled usage of the default server side props handler, instead of the our custom one"
  type        = bool
  default     = false
}

variable "show_debug_logs" {
  description = "Boolean to enabled debug logs"
  type        = bool
  default     = false
}

variable "pre_resize_images" {
  description = "Boolean to enabled the resizing of public images, after each deployment. Enabling this might increase the AWS bill"
  type        = bool
  default     = false
}

variable "delete_resized_versions" {
  description = "Boolean to disable the trigger for deleting old resized versions of public images"
  type        = bool
  default     = true
}

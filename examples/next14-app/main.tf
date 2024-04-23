provider "aws" {
  region = "eu-central-1" #customize your region
}

provider "aws" {
  alias  = "global_region"
  region = "us-east-1" #must be us-east-1
}

module "next_serverless" {
  source = "emyriounis/nextjs-serverless/aws"

  deployment_name = "tm-nextjs-serverless" #needs to be unique since it will create s3 buckets
  region          = "eu-central-1"         #customize your region
  base_dir        = "./"                   #The base directory of the next.js app

  next_lambda_runtime        = "nodejs20.x"
  image_optimization_runtime = "nodejs20.x"
}

output "next_serverless" {
  value = module.next_serverless.cloudfront_url
}
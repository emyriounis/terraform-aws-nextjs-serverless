# Changelog

All notable changes to this project will be documented in this file.

<!-- ## [Unreleased] -->

## [v0.4.3] - 2024-05-15

- Add `custom_image_types` tf variable

## [v0.4.2] - 2024-05-14

- Add `create_cloudfront_invalidation` tf variable

## [v0.4.1] - 2024-05-14

- Bugfix: disable caching for server-side rendering
- Add cloudfront invalidation after every deployment

## [v0.4.0] - 2024-05-14

- Support `context` argument on `getServerSideProps()`, when using the `pages/` router

## [v0.3.9] - 2024-05-13

- Support all components for rendering images (`'webp', 'jpeg', 'png', 'gif', 'avif', 'svg'`)

## [v0.3.8] - 2024-04-30

- Add `x-forwarded-host` headers to the request info
- Deprecate `override_host_header` variable

## [v0.3.7] - 2024-04-29

- Add `cloudfront_function_associations` variable to associate cloudfront functions with the defaulf distribution
- Add `override_host_header` variable to enabled overriding of host header, by the custom domain
- Add `wait_for_distribution_deployment` variable to stop waiting for the distribution status to change from `InProgress` to `Deployed`

## [v0.3.6] - 2024-04-25

- Bug fix next handler

## [v0.3.5] - 2024-04-25

- Bug fix next handler

## [v0.3.4] - 2024-04-25

- Add `show_debug_logs` variable to enabled debug logs

## [v0.3.3] - 2024-04-25

- Add `use_default_server_side_props_handler` variable to enabled usage of the default server side props handler, instead of the our custom one

## [v0.3.2] - 2024-04-23

Updates:

- Rename SSR Lambda
- Pump default nodejs runtime to v18

**Breaking Changes**

- Require an aws provider for global region (must be `us-east-1`)

## [v0.3.1] - 2024-03-26

- Fix git urls

## [v0.3.0] - 2024-03-09

- Set up forked repo, module & packages

## [v0.2.20] - 2023-12-13

- Fix broken SPA feature

## [v0.2.19] - 2023-12-06

- Option to copy all packages directly into the next_lambda

## [v0.2.18] - 2023-12-04

- Support remote images

## [v0.2.17] - 2023-11-23

Updates:

- add & update customization options of the module through terraform variables terraform-aws-nextjs-serverless/pull/42)
- store next_lambda source zip in s3
- expand image examples
- update cache diagram
- update dependencies versions to latest

**Breaking Changes**

- `lambda_memory_size` is replaced by `next_lambda_memory_size` & `image_optimization_lambda_memory_size`
- `runtime` is replaced by `next_lambda_runtime` & `image_optimization_runtime`
- `logs_retention` is replaced by `next_lambda_logs_retention` & `image_optimization_logs_retention`

## [v0.2.16] - 2023-11-20

- Bugfix: next_lambda_layer was not updating
- `ns-build`: Option to copy some packages directly into the next_lambda, since in some rare cases import from the layer fails

## [v0.2.13] - 2023-11-16

- Add docs about dependancies
- Bugfix: Image redirection had issues with deeply nested files

## [v0.2.11] - 2023-11-03

- Add SSR example
- Add CHANGELOG docs
- Fix: Set a version for every package used by `ns-build`

## [v0.2.10] - 2023-11-01

**Add License**

- Add License for the module
- Add License for the modulethe packages

## [v0.2.8] - 2023-11-01

**Intialize Terraform Tests**

- Add terraform tests using TerraTest
- Improve visualizations
- Improved Documentation

## [v0.2.6] - 2023-10-26

- Improve visualizations

## [v0.2.5] - 2023-10-26

- Add visualization diagrams for the module and the distribution

## [v0.2.4] - 2023-10-23

- Fix: S3 cross-region access for Image Optimization on Lambda@Edge

## [v0.2.1] - 2023-10-23

**Improve Image Optimization**

- Image Optimization: fetch images from S3, instead of public S3 URL

## [v0.2.0] - 2023-10-23

**Restructure Modules**

- Restructure the Modules' structure to support future plans
- Release a functional version of Image Optimization feature

## [v0.1.1] - 2023-10-20

- Fix: lambda@edge source code read

## [v0.1.0] - 2023-10-20

**Intial Image Optimization Feature Releaze**

- Serve public assets using Lambda@Edge to optimize size, file type, quality

## [v0.0.7] - 2023-09-12

- Fix cloudwatch log group name mis-configuration

## [v0.0.6] - 2023-09-12

- Add next_lambda_policy_statements option

## [v0.0.4] - 2023-09-12

- Change: Store next_lambda layer in S3, instead of uploading it directly

## [v0.0.2] - 2023-09-07

- Add the custom domain option for the CloudFront distribution terraform-aws-nextjs-serverless/pull/5)
- Add the option for next_lambda env vars
- Fix BucketACL issue

## [v0.0.1] - 2023-09-04

**Initial Release**

- Serve next.js app with AWS Lambda & API Gateway
- Serve static assets with CloudFront & S3
- Serve public assets with CloudFront & S3

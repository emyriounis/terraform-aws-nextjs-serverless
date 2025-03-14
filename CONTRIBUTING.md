# Contributing

### Feel free to contribute to this module.

As a general advice it is always a good idea to raise an [issue](https://github.com/emyriounis/terraform-aws-nextjs-serverless/issues) before creating a new pull request. <br> This ensures that we don't have to reject [pull requests](https://github.com/emyriounis/terraform-aws-nextjs-serverless/pulls) that are not aligning with our roadmap and not wasting your valuable time.

## Reporting Bugs

If you encounter a bug, please open an [issue](https://github.com/emyriounis/terraform-aws-nextjs-serverless/issues) on the GitHub repository. <br> Be sure to include as much information as possible to help us understand and reproduce the problem.

## Feature Requests

If you have an idea for a new feature or enhancement, please feel free to open an [issue](https://github.com/emyriounis/terraform-aws-nextjs-serverless/issues) and describe it. <br> We'd love to hear your suggestions!

## Testing

Please check our [testing guidelines](https://github.com/emyriounis/terraform-aws-nextjs-serverless/blob/main/tests).

## Development Workflow

### ns-build package

1. Edit the `examples/[selected_example]/node_modules/ns-build/bin/ns-build.sh` file.
2. Run `npm run ns-build` to build the Next.js app using the custom script.
3. Re-deploy the module.
4. Make sure your changes are applied and existing functionality is not broken.
5. Copy the updates you made to the `packages/ns-build/bin/ns-build.sh` file.

### ns-img-rdr packages

1. Make your changes
2. Run `npm run prepare-lambda`
3. Copy `packages/ns-img-rdr/source.zip` to `examples/nextjs-v13/deployments/ns-img-rdr/source.zip`
4. Re-deploy the module.
5. Make sure your changes are applied and existing functionality is not broken.

### ns-img-opt packages

1. Make your changes
2. Run `npm run prepare-lambda`
3. Copy `packages/ns-img-opt/source.zip` to `examples/nextjs-v13/deployments/ns-img-opt/source.zip`
4. Re-deploy the module.
5. Make sure your changes are applied and existing functionality is not broken.

### next_serverless module

1. Switch to the local source

```diff
module "tf_next" {
- source  = "emyriounis/nextjs-serverless/aws"
- version = "1.5.0"
+ source = "../../../"
  ...
}
```

2. Make your changes to the terraform files
3. Validate them (`terraform validate`)
4. Re-deploy the module.
5. Make sure your changes are applied and existing functionality is not broken.
6. Follow existing format (`terraform fmt -recursive`)

## Issues

If you face any problem, feel free to open an [issue](https://github.com/emyriounis/terraform-aws-nextjs-serverless/issues).

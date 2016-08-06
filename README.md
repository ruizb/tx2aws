# tx2aws

This project's main goal is to test the [RxJS](https://github.com/Reactive-Extensions/RxJS) library.

Any comment to improve the RxJS usage is appreciated! :heart:

## What it does

1. Get reviewed translations from a given project and resource from [Transifex](https://transifex.com)
2. Create a JSON file holding the translations for each language found
3. Upload these files to the [AWS S3 service](https://aws.amazon.com/fr/s3/)

**Important:** the `JSON key-value` type is required on the resource.

## Requirements

The following env variables are required:

- **TX_USER** Transifex username
- **TX_PASS** Transifex password
- **AWS_BUCKET** AWS S3 bucket name
- **AWS_PATH** AWS S3 bucket path where to store the translation files
- **AWS_ACCESS_KEY_ID** AWS access key ID (see [AWS credentials](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSGettingStartedGuide/AWSCredentials.html))
- **AWS_SECRET_ACCESS_KEY** AWS secret access key

## Usage

```
node . project-slug resource-slug [comma-separated list of excluded languages]
```

## Example

```
node . my-project main it,es
```

Output:

```
Excluded languages: en@pirate, it, es
Got 10 languages for my-project/main: ar, zh, en_US, de, it, ja, ko, pt, es, th
File dist/files/en_US.json created with 13 reviewed translations for the language: en_US (fallback language)
File dist/files/ar.json created with 13 reviewed translations for the language: ar
File dist/files/zh.json created with 13 reviewed translations for the language: zh
File dist/files/de.json created with 13 reviewed translations for the language: de
File dist/files/ja.json created with 13 reviewed translations for the language: ja
File dist/files/ko.json created with 13 reviewed translations for the language: ko
File dist/files/pt.json created with 13 reviewed translations for the language: pt
File dist/files/th.json created with 13 reviewed translations for the language: th
File dist/files/en_US.json successfully uploaded to test/tx2aws/en_US.json on bucket bob
File dist/files/ar.json successfully uploaded to test/tx2aws/ar.json on bucket bob
File dist/files/zh.json successfully uploaded to test/tx2aws/zh.json on bucket bob
File dist/files/de.json successfully uploaded to test/tx2aws/de.json on bucket bob
File dist/files/ja.json successfully uploaded to test/tx2aws/ja.json on bucket bob
File dist/files/ko.json successfully uploaded to test/tx2aws/ko.json on bucket bob
File dist/files/pt.json successfully uploaded to test/tx2aws/pt.json on bucket bob
File dist/files/th.json successfully uploaded to test/tx2aws/th.json on bucket bob

```

## Contributing

As the project is built with *babel*, you must run `npm run build` after each change in the `src` directory (or simply use `npm run watch` when doing multiple changes over time).

import aws from 'aws-sdk';
import rx from 'rx';
import fs from 'fs';
import Promise from 'bluebird';

export class AwsS3Service {

  constructor(config = {}) {
    this.config = config;

    aws.config.update({
      accessKeyId: config.aws.key,
      secretAccessKey: config.aws.secret
    });

    this.s3 = new aws.S3();
  }

  getUploadFilesStream(translationsFilesZipStream) {
    return translationsFilesZipStream
      .reduce((list, res) => {
        const [language, , filename] = res;
        const file = fs.createReadStream(filename);
        const params = {
          Bucket: this.config.aws.bucket,
          Key: `${this.config.aws.path}/${language}.json`,
          Body: file
        };
        const promise = new Promise((resolve, reject) => {
          this.s3.upload(params)
            .send((err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
        });
        list.push(promise);
        return list;
      }, [])
      .flatMap(uploads => rx.Observable.forkJoin(uploads))
      .flatMap(res => rx.Observable.from(res));
  }

}

export default (config) => new AwsS3Service(config);

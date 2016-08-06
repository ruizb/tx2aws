import rc from 'rc';
import * as _ from 'lodash';
import rx from 'rx';
import chalk from 'chalk';

import getTransifexService from './lib/transifexService';
import getFilesService from './lib/filesService';
import getAwsS3Service from './lib/awsS3Service';

const args = process.argv.splice(2);
const [projectSlug, resourceSlug, excludeLanguagesStr] = args;

/* -------------------------------------------------------
 * Config
 * ---------------------------------------------------- */

const config = rc('tx2aws', {
  transifex: {
    project: projectSlug,
    resource: resourceSlug,
    username: process.env.TX_USER,
    password: process.env.TX_PASS,
    excludeLanguages: ['en@pirate'].concat(excludeLanguagesStr ? excludeLanguagesStr.split(',') : []),
    fallbackLanguage: 'en_US'
  },
  aws: {
    bucket: process.env.AWS_BUCKET,
    path: process.env.AWS_PATH,
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/* -------------------------------------------------------
 * Requirements
 * ---------------------------------------------------- */

if (!projectSlug || !resourceSlug) {
  throw new Error('Transifex project slug and resource slug are required as (respectively) arguments 1 and 2 (usage: node . project-slug resource-slug [comma-separated language codes to exclude])');
}

if (!process.env.TX_USER || !process.env.TX_PASS) {
  throw new Error('Transifex credentials are required as env variables TX_USER and TX_PASS');
}

if (!process.env.AWS_BUCKET) {
  throw new Error('AWS S3 bucket name is required as env variable AWS_BUCKET');
}

if (!process.env.AWS_PATH) {
  throw new Error('AWS S3 path is required as env variable AWS_PATH');
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS S3 credentials are required as env variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
}

if (_.includes(config.transifex.excludeLanguages, config.transifex.fallbackLanguage)) {
  throw new Error('Exclude languages list contains the fallback language');
}

/* -------------------------------------------------------
 * Init
 * ---------------------------------------------------- */

const transifexService = getTransifexService(config);
const filesService = getFilesService();
const awsS3Service = getAwsS3Service(config);
console.log(`Excluded languages: ${chalk.yellow(config.transifex.excludeLanguages.join(', '))}`);

/* -------------------------------------------------------
 * Streams
 * ---------------------------------------------------- */

const finalTranslationsStream = transifexService.getFinalTranslationsStream();
const writeFilesStream = filesService.getWriteFilesStream(finalTranslationsStream);
const translationsFilesZipStream = rx.Observable.zip(finalTranslationsStream, writeFilesStream, _.concat);
const uploadFilesStream = awsS3Service.getUploadFilesStream(translationsFilesZipStream).publish();

/* -------------------------------------------------------
 * Subscriptions
 * ---------------------------------------------------- */

transifexService.getLanguagesStream()
  .reduce((list, language) => {
    list.push(language);
    return list;
  }, [])
  .subscribe(languages => console.log(`Got ${chalk.green(_.size(languages))} languages for ${chalk.green(`${config.transifex.project}/${config.transifex.resource}`)}: ${languages.join(', ')}`));

translationsFilesZipStream
  .subscribe(res => {
    const [language, translations, filename] = res;
    console.log(`File ${chalk.green(filename.replace(`${process.env.PWD}/`, ''))} created with ${chalk.green(_.size(_.keys(translations)))} reviewed translations for the language: ${chalk.green(language)}${language === config.transifex.fallbackLanguage ? ' (fallback language)' : ''}`);
  }, null, uploadFilesStream.connect.bind(uploadFilesStream));

translationsFilesZipStream
  .zip(uploadFilesStream, _.concat)
  .subscribe(res => {
    const [, , filename, awsRes] = res;
    console.log(`File ${chalk.green(filename.replace(process.env.PWD + '/', ''))} successfully uploaded to ${chalk.green(awsRes.key)} on bucket ${chalk.green(awsRes.Bucket)}`);
  });

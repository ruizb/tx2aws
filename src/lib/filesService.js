import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import rx from 'rx';

export class FilesService {

  getWriteFilesStream(translationsStream) {
    return translationsStream
      .flatMap(res =>
        rx.Observable
          .from(res)
          .concat(
            rx.Observable.create(observer => {
              const [language, translations] = res;
              const filename = path.resolve(`${path.resolve(`${__dirname}/../files/`)}/${language}.json`);
              // create intermediate folders then create the file
              mkdirp(path.dirname(filename), err => {
                if (err) {
                  throw err;
                }
                fs.writeFileSync(filename, JSON.stringify(translations, null, 2));
                observer.onNext(filename);
                observer.onCompleted();
              });
            })
          )
          .toArray()
      );
  }

}

export default () => new FilesService();

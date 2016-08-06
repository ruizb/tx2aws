import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

export class FilesService {

  getWriteFilesStream(finalTranslationsStream) {
    return finalTranslationsStream
      .map(res => {
        const [language, translations] = res;
        const filename = path.resolve(`${path.resolve(`${__dirname}/../files/`)}/${language}.json`);
        // create intermediate folders then create the file
        mkdirp(path.dirname(filename), err => {
          if (err) {
            throw err;
          }
          fs.writeFileSync(filename, JSON.stringify(translations, null, 2));
        });
        return filename;
      });
  }

}

export default () => new FilesService();

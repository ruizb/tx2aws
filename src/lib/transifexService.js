import * as _ from 'lodash';
import Promise from 'bluebird';
import Transifex from 'transifex';
import rx from 'rx';

export class TransifexService {

  constructor(config = {}) {
    this.config = config;
    this.tx = new Transifex({
      project_slug: _.get(config, 'transifex.project'),
      credential: `${_.get(config, 'transifex.username')}:${_.get(config, 'transifex.password')}`
    });
  }

  getAvailableLanguages(resourceName) {
    return new Promise((resolve, reject) => {
      this.tx.resourcesInstanceMethods(_.get(this.config, 'transifex.project'), resourceName, true, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    });
  }

  getTranslations(resourceName, languageCode) {
    return new Promise((resolve, reject) => {
      this.tx.translationInstanceMethod(_.get(this.config, 'transifex.project'), resourceName, languageCode, {mode: 'reviewed'}, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    });
  }

  getLanguagesStream() {
    return rx.Observable.fromPromise(this.getAvailableLanguages(this.config.transifex.resource))
      .map(res => res.available_languages)
      .flatMap(res => rx.Observable.from(res))
      .map(language => language.code)
      .filter(language => !_.includes(_.get(this.config, 'transifex.excludeLanguages', []), language));
  }

  getFallbackTranslationsStream() {
    return this.getLanguagesStream()
      .filter(language => language === this.config.transifex.fallbackLanguage);
  }

  getFallbackTranslationsPromiseStream() {
    return this._handleTranslationsStream(this.getFallbackTranslationsStream())
  }

  getTranslationsStream() {
    return this.getLanguagesStream()
      // get all the non-fallback languages
      .filter(language => language !== this.config.transifex.fallbackLanguage);
  }

  getTranslationsPromiseStream() {
    return this._handleTranslationsStream(this.getTranslationsStream())
  }

  getFinalTranslationsStream() {
    return rx.Observable.zip(this.getFallbackTranslationsStream(), this.getFallbackTranslationsPromiseStream())
      .concat(rx.Observable.zip(this.getTranslationsStream(), this.getTranslationsPromiseStream()));
  }

  _handleTranslationsStream(stream) {
    return stream
      .flatMap(language =>
        rx.Observable
          .just(language)
          .concat(
            rx.Observable
              .fromPromise(this.getTranslations(this.config.transifex.resource, language))
              .map(res => JSON.parse(res))
          )
          .toArray()
      );
  }

}

export default (config) => new TransifexService(config);

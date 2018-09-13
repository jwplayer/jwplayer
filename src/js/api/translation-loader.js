import { loadJsonTranslation, isTranslationAvailable } from 'utils/language';

export default function loadTranslations(model) {
    const language = 'la';//model.attributes.language;
    if (isTranslationAvailable(language)) {
        return new Promise((resolve, reject) => {
            loadJsonTranslation(model.attributes.base, language, result => {
                model.attributes.translation = result.response;
                resolve();
            }, error => {
                //TODO: trigger warning
                resolve();
            });
        });
    }
    return resolved;
}
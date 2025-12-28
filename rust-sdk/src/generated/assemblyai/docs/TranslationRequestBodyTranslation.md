# TranslationRequestBodyTranslation

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**target_languages** | **Vec<String>** | List of target language codes (e.g., `[\"es\", \"de\"]`) | 
**formal** | Option<**bool**> | Use formal language style | [optional][default to true]
**match_original_utterance** | Option<**bool**> | When enabled with Speaker Labels, returns translated text in the utterances array. Each utterance will include a `translated_texts` key containing translations for each target language. | [optional][default to false]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



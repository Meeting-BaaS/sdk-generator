# RealtimeProcessingConfig

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**custom_vocabulary** | Option<**bool**> | If true, enable custom vocabulary for the transcription. | [optional][default to false]
**custom_vocabulary_config** | Option<[**models::CustomVocabularyConfigDto**](CustomVocabularyConfigDTO.md)> | Custom vocabulary configuration, if `custom_vocabulary` is enabled | [optional]
**custom_spelling** | Option<**bool**> | If true, enable custom spelling for the transcription. | [optional][default to false]
**custom_spelling_config** | Option<[**models::CustomSpellingConfigDto**](CustomSpellingConfigDTO.md)> | Custom spelling configuration, if `custom_spelling` is enabled | [optional]
**translation** | Option<**bool**> | If true, enable translation for the transcription | [optional][default to false]
**translation_config** | Option<[**models::TranslationConfigDto**](TranslationConfigDTO.md)> | Translation configuration, if `translation` is enabled | [optional]
**named_entity_recognition** | Option<**bool**> | If true, enable named entity recognition for the transcription. | [optional][default to false]
**sentiment_analysis** | Option<**bool**> | If true, enable sentiment analysis for the transcription. | [optional][default to false]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



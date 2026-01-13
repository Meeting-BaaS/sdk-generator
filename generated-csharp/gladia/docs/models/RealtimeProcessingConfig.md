# Gladia.SDK.Model.RealtimeProcessingConfig

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**CustomVocabulary** | **bool** | If true, enable custom vocabulary for the transcription. | [optional] [default to false]
**CustomVocabularyConfig** | [**CustomVocabularyConfigDTO**](CustomVocabularyConfigDTO.md) | Custom vocabulary configuration, if &#x60;custom_vocabulary&#x60; is enabled | [optional] 
**CustomSpelling** | **bool** | If true, enable custom spelling for the transcription. | [optional] [default to false]
**CustomSpellingConfig** | [**CustomSpellingConfigDTO**](CustomSpellingConfigDTO.md) | Custom spelling configuration, if &#x60;custom_spelling&#x60; is enabled | [optional] 
**Translation** | **bool** | If true, enable translation for the transcription | [optional] [default to false]
**TranslationConfig** | [**TranslationConfigDTO**](TranslationConfigDTO.md) | Translation configuration, if &#x60;translation&#x60; is enabled | [optional] 
**NamedEntityRecognition** | **bool** | If true, enable named entity recognition for the transcription. | [optional] [default to false]
**SentimentAnalysis** | **bool** | If true, enable sentiment analysis for the transcription. | [optional] [default to false]

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


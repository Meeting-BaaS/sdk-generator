# TranslationConfigDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**target_languages** | [**Vec<models::TranslationLanguageCodeEnum>**](TranslationLanguageCodeEnum.md) | Target language in `iso639-1` format you want the transcription translated to | 
**model** | Option<[**models::TranslationModelEnum**](TranslationModelEnum.md)> | Model you want the translation model to use to translate | [optional][default to Base]
**match_original_utterances** | Option<**bool**> | Align translated utterances with the original ones | [optional][default to true]
**lipsync** | Option<**bool**> | Whether to apply lipsync to the translated transcription.  | [optional][default to true]
**context_adaptation** | Option<**bool**> | Enables or disables context-aware translation features that allow the model to adapt translations based on provided context. | [optional][default to true]
**context** | Option<**String**> | Context information to improve translation accuracy | [optional]
**informal** | Option<**bool**> | Forces the translation to use informal language forms when available in the target language. | [optional][default to false]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



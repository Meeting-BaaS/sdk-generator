# Gladia.SDK.Model.TranslationConfigDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**TargetLanguages** | [**List&lt;TranslationLanguageCodeEnum&gt;**](TranslationLanguageCodeEnum.md) | Target language in &#x60;iso639-1&#x60; format you want the transcription translated to | 
**Model** | **TranslationModelEnum** | Model you want the translation model to use to translate | [optional] 
**MatchOriginalUtterances** | **bool** | Align translated utterances with the original ones | [optional] [default to true]
**Lipsync** | **bool** | Whether to apply lipsync to the translated transcription.  | [optional] [default to true]
**ContextAdaptation** | **bool** | Enables or disables context-aware translation features that allow the model to adapt translations based on provided context. | [optional] [default to true]
**Context** | **string** | Context information to improve translation accuracy | [optional] 
**Informal** | **bool** | Forces the translation to use informal language forms when available in the target language. | [optional] [default to false]

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


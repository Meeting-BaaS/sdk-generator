# Gladia.SDK.Model.LanguageConfig

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Languages** | [**List&lt;TranscriptionLanguageCodeEnum&gt;**](TranscriptionLanguageCodeEnum.md) | If one language is set, it will be used for the transcription. Otherwise, language will be auto-detected by the model. | [optional] 
**CodeSwitching** | **bool** | If true, language will be auto-detected on each utterance. Otherwise, language will be auto-detected on first utterance and then used for the rest of the transcription. If one language is set, this option will be ignored. | [optional] [default to false]

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


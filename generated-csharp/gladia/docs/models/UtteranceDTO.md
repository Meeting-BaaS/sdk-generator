# Gladia.SDK.Model.UtteranceDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Start** | **decimal** | Start timestamp in seconds of this utterance | 
**End** | **decimal** | End timestamp in seconds of this utterance | 
**Confidence** | **decimal** | Confidence on the transcribed utterance (1 &#x3D; 100% confident) | 
**Channel** | **int** | Audio channel of where this utterance has been transcribed from | 
**Words** | [**List&lt;WordDTO&gt;**](WordDTO.md) | List of words of the utterance, split by timestamp | 
**Text** | **string** | Transcription for this utterance | 
**Language** | **TranscriptionLanguageCodeEnum** | Spoken language in this utterance | 
**Speaker** | **int** | If &#x60;diarization&#x60; enabled, speaker identification number | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


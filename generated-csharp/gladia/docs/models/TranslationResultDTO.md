# Gladia.SDK.Model.TranslationResultDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Error** | [**AddonErrorDTO**](AddonErrorDTO.md) | Contains the error details of the failed addon | 
**FullTranscript** | **string** | All transcription on text format without any other information | 
**Languages** | [**List&lt;TranslationLanguageCodeEnum&gt;**](TranslationLanguageCodeEnum.md) | All the detected languages in the audio sorted from the most detected to the less detected | 
**Utterances** | [**List&lt;UtteranceDTO&gt;**](UtteranceDTO.md) | Transcribed speech utterances present in the audio | 
**Sentences** | [**List&lt;SentencesDTO&gt;**](SentencesDTO.md) | If &#x60;sentences&#x60; has been enabled, sentences results for this translation | [optional] 
**Subtitles** | [**List&lt;SubtitleDTO&gt;**](SubtitleDTO.md) | If &#x60;subtitles&#x60; has been enabled, subtitles results for this translation | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


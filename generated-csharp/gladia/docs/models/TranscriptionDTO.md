# Gladia.SDK.Model.TranscriptionDTO

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**FullTranscript** | **string** | All transcription on text format without any other information | 
**Languages** | [**List&lt;TranscriptionLanguageCodeEnum&gt;**](TranscriptionLanguageCodeEnum.md) | All the detected languages in the audio sorted from the most detected to the less detected | 
**Utterances** | [**List&lt;UtteranceDTO&gt;**](UtteranceDTO.md) | Transcribed speech utterances present in the audio | 
**Sentences** | [**List&lt;SentencesDTO&gt;**](SentencesDTO.md) | If &#x60;sentences&#x60; has been enabled, sentences results | [optional] 
**Subtitles** | [**List&lt;SubtitleDTO&gt;**](SubtitleDTO.md) | If &#x60;subtitles&#x60; has been enabled, subtitles results | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


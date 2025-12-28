# UtteranceDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**start** | **f64** | Start timestamp in seconds of this utterance | 
**end** | **f64** | End timestamp in seconds of this utterance | 
**confidence** | **f64** | Confidence on the transcribed utterance (1 = 100% confident) | 
**channel** | **i32** | Audio channel of where this utterance has been transcribed from | 
**speaker** | Option<**i32**> | If `diarization` enabled, speaker identification number | [optional]
**words** | [**Vec<models::WordDto>**](WordDTO.md) | List of words of the utterance, split by timestamp | 
**text** | **String** | Transcription for this utterance | 
**language** | [**models::TranscriptionLanguageCodeEnum**](TranscriptionLanguageCodeEnum.md) | Spoken language in this utterance | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



# TranscriptionDto

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**full_transcript** | **String** | All transcription on text format without any other information | 
**languages** | [**Vec<models::TranscriptionLanguageCodeEnum>**](TranscriptionLanguageCodeEnum.md) | All the detected languages in the audio sorted from the most detected to the less detected | 
**sentences** | Option<[**Vec<models::SentencesDto>**](SentencesDTO.md)> | If `sentences` has been enabled, sentences results | [optional]
**subtitles** | Option<[**Vec<models::SubtitleDto>**](SubtitleDTO.md)> | If `subtitles` has been enabled, subtitles results | [optional]
**utterances** | [**Vec<models::UtteranceDto>**](UtteranceDTO.md) | Transcribed speech utterances present in the audio | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



# SentencesResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**uuid::Uuid**](uuid::Uuid.md) | The unique identifier for the transcript | 
**confidence** | **f64** | The confidence score for the transcript | 
**audio_duration** | **f64** | The duration of the audio file in seconds | 
**sentences** | [**Vec<models::TranscriptSentence>**](TranscriptSentence.md) | An array of sentences in the transcript | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



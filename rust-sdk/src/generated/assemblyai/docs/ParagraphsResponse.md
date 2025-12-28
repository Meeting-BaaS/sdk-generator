# ParagraphsResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**uuid::Uuid**](uuid::Uuid.md) | The unique identifier of your transcript | 
**confidence** | **f64** | The confidence score for the transcript | 
**audio_duration** | **f64** | The duration of the audio file in seconds | 
**paragraphs** | [**Vec<models::TranscriptParagraph>**](TranscriptParagraph.md) | An array of paragraphs in the transcript | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



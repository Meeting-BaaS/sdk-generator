# TranscriptWord

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**confidence** | **f64** | The confidence score for the transcript of this word | 
**start** | **i32** | The starting time, in milliseconds, for the word | 
**end** | **i32** | The ending time, in milliseconds, for the word | 
**text** | **String** | The text of the word | 
**channel** | Option<**String**> | The channel of the word. The left and right channels are channels 1 and 2. Additional channels increment the channel number sequentially. | [optional]
**speaker** | Option<**String**> | The speaker of the word if [Speaker Diarization](https://www.assemblyai.com/docs/models/speaker-diarization) is enabled, else null | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



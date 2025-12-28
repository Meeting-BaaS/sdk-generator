# TranscriptSentence

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**text** | **String** | The transcript of the sentence | 
**start** | **i32** | The starting time, in milliseconds, for the sentence | 
**end** | **i32** | The ending time, in milliseconds, for the sentence | 
**confidence** | **f64** | The confidence score for the transcript of this sentence | 
**words** | [**Vec<models::TranscriptWord>**](TranscriptWord.md) | An array of words in the sentence | 
**channel** | Option<**String**> | The channel of the sentence. The left and right channels are channels 1 and 2. Additional channels increment the channel number sequentially. | [optional]
**speaker** | Option<**String**> | The speaker of the sentence if [Speaker Diarization](https://www.assemblyai.com/docs/models/speaker-diarization) is enabled, else null | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



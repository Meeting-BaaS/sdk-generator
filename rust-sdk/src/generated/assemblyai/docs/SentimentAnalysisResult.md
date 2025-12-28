# SentimentAnalysisResult

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**text** | **String** | The transcript of the sentence | 
**start** | **i32** | The starting time, in milliseconds, of the sentence | 
**end** | **i32** | The ending time, in milliseconds, of the sentence | 
**sentiment** | [**models::Sentiment**](Sentiment.md) | The detected sentiment for the sentence, one of POSITIVE, NEUTRAL, NEGATIVE | 
**confidence** | **f64** | The confidence score for the detected sentiment of the sentence, from 0 to 1 | 
**channel** | Option<**String**> | The channel of this utterance. The left and right channels are channels 1 and 2. Additional channels increment the channel number sequentially. | [optional]
**speaker** | Option<**String**> | The speaker of the sentence if [Speaker Diarization](https://www.assemblyai.com/docs/models/speaker-diarization) is enabled, else null | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



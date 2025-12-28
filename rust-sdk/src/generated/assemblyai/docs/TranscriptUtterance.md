# TranscriptUtterance

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**confidence** | **f64** | The confidence score for the transcript of this utterance | 
**start** | **i32** | The starting time, in milliseconds, of the utterance in the audio file | 
**end** | **i32** | The ending time, in milliseconds, of the utterance in the audio file | 
**text** | **String** | The text for this utterance | 
**words** | [**Vec<models::TranscriptWord>**](TranscriptWord.md) | The words in the utterance. | 
**channel** | Option<**String**> | The channel of this utterance. The left and right channels are channels 1 and 2. Additional channels increment the channel number sequentially. | [optional]
**speaker** | **String** | The speaker of this utterance, where each speaker is assigned a sequential capital letter - e.g. \"A\" for Speaker A, \"B\" for Speaker B, etc. | 
**translated_texts** | Option<**std::collections::HashMap<String, String>**> | Translations keyed by language code (e.g., `{\"es\": \"Texto traducido\", \"de\": \"Übersetzter Text\"}`). Only present when `match_original_utterance` is enabled with translation. | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



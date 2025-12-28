# CallbackTranscriptionSuccessPayload

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**uuid::Uuid**](uuid::Uuid.md) | Id of the job | 
**event** | **String** | Type of event | [default to TranscriptionSuccess]
**payload** | [**models::TranscriptionResultDto**](TranscriptionResultDTO.md) | Result of the transcription | 
**custom_metadata** | Option<[**std::collections::HashMap<String, serde_json::Value>**](serde_json::Value.md)> | Custom metadata given in the initial request | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



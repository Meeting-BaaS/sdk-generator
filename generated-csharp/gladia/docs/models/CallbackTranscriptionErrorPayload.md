# Gladia.SDK.Model.CallbackTranscriptionErrorPayload

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | **Guid** | Id of the job | 
**Error** | [**ErrorDTO**](ErrorDTO.md) | The error that occurred during the transcription | 
**Event** | **string** | Type of event | [default to EventEnum.TranscriptionError]
**CustomMetadata** | **Dictionary&lt;string, Object&gt;** | Custom metadata given in the initial request | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


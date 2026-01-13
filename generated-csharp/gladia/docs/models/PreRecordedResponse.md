# Gladia.SDK.Model.PreRecordedResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Id** | **Guid** | Id of the job | 
**RequestId** | **string** | Debug id | 
**VarVersion** | **int** | API version | 
**Status** | **string** | \&quot;queued\&quot;: the job has been queued. \&quot;processing\&quot;: the job is being processed. \&quot;done\&quot;: the job has been processed and the result is available. \&quot;error\&quot;: an error occurred during the job&#39;s processing. | 
**CreatedAt** | **DateTime** | Creation date | 
**PostSessionMetadata** | **Object** | For debugging purposes, send data that could help to identify issues | 
**CompletedAt** | **DateTime** | Completion date when status is \&quot;done\&quot; or \&quot;error\&quot; | [optional] 
**CustomMetadata** | **Dictionary&lt;string, Object&gt;** | Custom metadata given in the initial request | [optional] 
**ErrorCode** | **int** | HTTP status code of the error if status is \&quot;error\&quot; | [optional] 
**Kind** | **string** |  | [default to KindEnum.PreRecorded]
**File** | [**FileResponse**](FileResponse.md) | The file data you uploaded. Can be null if status is \&quot;error\&quot; | [optional] 
**RequestParams** | [**PreRecordedRequestParamsResponse**](PreRecordedRequestParamsResponse.md) | Parameters used for this pre-recorded transcription. Can be null if status is \&quot;error\&quot; | [optional] 
**Result** | [**TranscriptionResultDTO**](TranscriptionResultDTO.md) | Pre-recorded transcription&#39;s result when status is \&quot;done\&quot; | [optional] 

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


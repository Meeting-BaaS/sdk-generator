# StreamingResponse

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**uuid::Uuid**](uuid::Uuid.md) | Id of the job | 
**request_id** | **String** | Debug id | 
**version** | **i32** | API version | 
**status** | **String** | \"queued\": the job has been queued. \"processing\": the job is being processed. \"done\": the job has been processed and the result is available. \"error\": an error occurred during the job's processing. | 
**created_at** | **String** | Creation date | 
**completed_at** | Option<**String**> | Completion date when status is \"done\" or \"error\" | [optional]
**custom_metadata** | Option<[**std::collections::HashMap<String, serde_json::Value>**](serde_json::Value.md)> | Custom metadata given in the initial request | [optional]
**error_code** | Option<**i32**> | HTTP status code of the error if status is \"error\" | [optional]
**post_session_metadata** | [**serde_json::Value**](.md) | For debugging purposes, send data that could help to identify issues | 
**kind** | **String** |  | [default to Live]
**file** | Option<[**models::FileResponse**](FileResponse.md)> | The file data you uploaded. Can be null if status is \"error\" | [optional]
**request_params** | Option<[**models::StreamingRequestParamsResponse**](StreamingRequestParamsResponse.md)> | Parameters used for this live transcription. Can be null if status is \"error\" | [optional]
**result** | Option<[**models::StreamingTranscriptionResultWithMessagesDto**](StreamingTranscriptionResultWithMessagesDTO.md)> | Live transcription's result when status is \"done\" | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



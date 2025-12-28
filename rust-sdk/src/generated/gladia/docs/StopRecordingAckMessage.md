# StopRecordingAckMessage

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**session_id** | **String** | Id of the live session | 
**created_at** | **String** | Date of creation of the message. The date is formatted as an ISO 8601 string | 
**acknowledged** | **bool** | Flag to indicate if the action was successfully acknowledged | 
**error** | [**models::Error**](Error.md) | Error message if the action was not successfully acknowledged | 
**r#type** | **String** |  | [default to StopRecording]
**data** | [**models::StopRecordingAckData**](StopRecordingAckData.md) | The message data. \"null\" if the action was not successfully acknowledged | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



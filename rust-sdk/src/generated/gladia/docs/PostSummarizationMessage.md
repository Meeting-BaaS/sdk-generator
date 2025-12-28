# PostSummarizationMessage

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**session_id** | **String** | Id of the live session | 
**created_at** | **String** | Date of creation of the message. The date is formatted as an ISO 8601 string | 
**error** | [**models::Error**](Error.md) | Error message if the addon failed | 
**r#type** | **String** |  | [default to PostSummarization]
**data** | [**models::PostSummarizationMessageData**](PostSummarizationMessageData.md) | The message data. \"null\" if the addon failed | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



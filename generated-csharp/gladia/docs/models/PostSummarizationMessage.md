# Gladia.SDK.Model.PostSummarizationMessage

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**SessionId** | **string** | Id of the live session | 
**CreatedAt** | **string** | Date of creation of the message. The date is formatted as an ISO 8601 string | 
**Error** | [**Error**](Error.md) | Error message if the addon failed | 
**Data** | [**PostSummarizationMessageData**](PostSummarizationMessageData.md) | The message data. \&quot;null\&quot; if the addon failed | 
**Type** | **string** |  | [default to TypeEnum.PostSummarization]

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


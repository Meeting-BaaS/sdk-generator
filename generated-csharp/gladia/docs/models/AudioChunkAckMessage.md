# Gladia.SDK.Model.AudioChunkAckMessage

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**SessionId** | **string** | Id of the live session | 
**CreatedAt** | **string** | Date of creation of the message. The date is formatted as an ISO 8601 string | 
**Acknowledged** | **bool** | Flag to indicate if the action was successfully acknowledged | 
**Error** | [**Error**](Error.md) | Error message if the action was not successfully acknowledged | 
**Data** | [**AudioChunkAckData**](AudioChunkAckData.md) | The message data. \&quot;null\&quot; if the action was not successfully acknowledged | 
**Type** | **string** |  | [default to TypeEnum.AudioChunk]

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


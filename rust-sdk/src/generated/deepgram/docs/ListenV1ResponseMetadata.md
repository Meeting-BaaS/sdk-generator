# ListenV1ResponseMetadata

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**transaction_key** | Option<**String**> |  | [optional][default to deprecated]
**request_id** | [**uuid::Uuid**](uuid::Uuid.md) |  | 
**sha256** | **String** |  | 
**created** | **String** |  | 
**duration** | **f64** |  | 
**channels** | **f64** |  | 
**models** | **Vec<String>** |  | 
**model_info** | [**serde_json::Value**](.md) |  | 
**summary_info** | Option<[**models::ListenV1ResponseMetadataSummaryInfo**](ListenV1ResponseMetadata_summary_info.md)> |  | [optional]
**sentiment_info** | Option<[**models::ListenV1ResponseMetadataSentimentInfo**](ListenV1ResponseMetadata_sentiment_info.md)> |  | [optional]
**topics_info** | Option<[**models::ListenV1ResponseMetadataTopicsInfo**](ListenV1ResponseMetadata_topics_info.md)> |  | [optional]
**intents_info** | Option<[**models::ListenV1ResponseMetadataIntentsInfo**](ListenV1ResponseMetadata_intents_info.md)> |  | [optional]
**tags** | Option<**Vec<String>**> |  | [optional]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



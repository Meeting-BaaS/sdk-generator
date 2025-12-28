# ListTranscriptParams

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | Option<**i32**> | Maximum amount of transcripts to retrieve | [optional][default to 10]
**status** | Option<[**models::TranscriptStatus**](TranscriptStatus.md)> | Filter by transcript status | [optional]
**created_on** | Option<[**String**](string.md)> | Only get transcripts created on this date | [optional]
**before_id** | Option<[**uuid::Uuid**](uuid::Uuid.md)> | Get transcripts that were created before this transcript ID | [optional]
**after_id** | Option<[**uuid::Uuid**](uuid::Uuid.md)> | Get transcripts that were created after this transcript ID | [optional]
**throttled_only** | Option<**bool**> | Only get throttled transcripts, overrides the status filter | [optional][default to false]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



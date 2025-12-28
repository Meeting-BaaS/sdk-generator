# CallbackConfig

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**url** | Option<**String**> | URL on which we will do a `POST` request with configured messages | [optional]
**receive_partial_transcripts** | Option<**bool**> | If true, partial transcript will be sent to the defined callback. | [optional][default to false]
**receive_final_transcripts** | Option<**bool**> | If true, final transcript will be sent to the defined callback. | [optional][default to true]
**receive_speech_events** | Option<**bool**> | If true, begin and end speech events will be sent to the defined callback. | [optional][default to false]
**receive_pre_processing_events** | Option<**bool**> | If true, pre-processing events will be sent to the defined callback. | [optional][default to true]
**receive_realtime_processing_events** | Option<**bool**> | If true, realtime processing events will be sent to the defined callback. | [optional][default to true]
**receive_post_processing_events** | Option<**bool**> | If true, post-processing events will be sent to the defined callback. | [optional][default to true]
**receive_acknowledgments** | Option<**bool**> | If true, acknowledgments will be sent to the defined callback. | [optional][default to false]
**receive_errors** | Option<**bool**> | If true, errors will be sent to the defined callback. | [optional][default to false]
**receive_lifecycle_events** | Option<**bool**> | If true, lifecycle events will be sent to the defined callback. | [optional][default to true]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)



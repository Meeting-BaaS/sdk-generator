# Gladia.SDK.Model.CallbackConfig

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**Url** | **string** | URL on which we will do a &#x60;POST&#x60; request with configured messages | [optional] 
**ReceivePartialTranscripts** | **bool** | If true, partial transcript will be sent to the defined callback. | [optional] [default to false]
**ReceiveFinalTranscripts** | **bool** | If true, final transcript will be sent to the defined callback. | [optional] [default to true]
**ReceiveSpeechEvents** | **bool** | If true, begin and end speech events will be sent to the defined callback. | [optional] [default to false]
**ReceivePreProcessingEvents** | **bool** | If true, pre-processing events will be sent to the defined callback. | [optional] [default to true]
**ReceiveRealtimeProcessingEvents** | **bool** | If true, realtime processing events will be sent to the defined callback. | [optional] [default to true]
**ReceivePostProcessingEvents** | **bool** | If true, post-processing events will be sent to the defined callback. | [optional] [default to true]
**ReceiveAcknowledgments** | **bool** | If true, acknowledgments will be sent to the defined callback. | [optional] [default to false]
**ReceiveErrors** | **bool** | If true, errors will be sent to the defined callback. | [optional] [default to false]
**ReceiveLifecycleEvents** | **bool** | If true, lifecycle events will be sent to the defined callback. | [optional] [default to true]

[[Back to Model list]](../../README.md#documentation-for-models) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to README]](../../README.md)


# \DefaultApi

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**live_end_recording_post**](DefaultApi.md#live_end_recording_post) | **POST** /live.end_recording | 
[**live_end_session_post**](DefaultApi.md#live_end_session_post) | **POST** /live.end_session | 
[**live_start_recording_post**](DefaultApi.md#live_start_recording_post) | **POST** /live.start_recording | 
[**live_start_session_post**](DefaultApi.md#live_start_session_post) | **POST** /live.start_session | 
[**transcription_created_post**](DefaultApi.md#transcription_created_post) | **POST** /transcription.created | 
[**transcription_error_post**](DefaultApi.md#transcription_error_post) | **POST** /transcription.error | 
[**transcription_success_post**](DefaultApi.md#transcription_success_post) | **POST** /transcription.success | 



## live_end_recording_post

> live_end_recording_post(webhook_live_end_recording_payload)


Sent when the live session recording has ended

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_live_end_recording_payload** | Option<[**WebhookLiveEndRecordingPayload**](WebhookLiveEndRecordingPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## live_end_session_post

> live_end_session_post(webhook_live_end_session_payload)


Sent when the live session post-processing has ended and the results are available

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_live_end_session_payload** | Option<[**WebhookLiveEndSessionPayload**](WebhookLiveEndSessionPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## live_start_recording_post

> live_start_recording_post(webhook_live_start_recording_payload)


Sent when we received the first audio chunk of a live session

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_live_start_recording_payload** | Option<[**WebhookLiveStartRecordingPayload**](WebhookLiveStartRecordingPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## live_start_session_post

> live_start_session_post(webhook_live_start_session_payload)


Sent when a live session has been initiated

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_live_start_session_payload** | Option<[**WebhookLiveStartSessionPayload**](WebhookLiveStartSessionPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_created_post

> transcription_created_post(webhook_transcription_created_payload)


Sent when a pre-recorded transcription job has been created

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_transcription_created_payload** | Option<[**WebhookTranscriptionCreatedPayload**](WebhookTranscriptionCreatedPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_error_post

> transcription_error_post(webhook_transcription_error_payload)


Sent when an error occurred on a pre-recorded transcription job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_transcription_error_payload** | Option<[**WebhookTranscriptionErrorPayload**](WebhookTranscriptionErrorPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_success_post

> transcription_success_post(webhook_transcription_success_payload)


Sent when a pre-recorded transcription job is done and its results are available

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**webhook_transcription_success_payload** | Option<[**WebhookTranscriptionSuccessPayload**](WebhookTranscriptionSuccessPayload.md)> |  |  |

### Return type

 (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


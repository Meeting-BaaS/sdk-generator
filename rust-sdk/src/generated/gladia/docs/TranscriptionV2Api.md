# \TranscriptionV2Api

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**transcription_controller_delete_transcript_v2**](TranscriptionV2Api.md#transcription_controller_delete_transcript_v2) | **DELETE** /v2/transcription/{id} | Delete the transcription job
[**transcription_controller_get_audio_v2**](TranscriptionV2Api.md#transcription_controller_get_audio_v2) | **GET** /v2/transcription/{id}/file | Download the audio file used for this transcription job
[**transcription_controller_get_transcript_v2**](TranscriptionV2Api.md#transcription_controller_get_transcript_v2) | **GET** /v2/transcription/{id} | Get the transcription job's metadata
[**transcription_controller_init_pre_recorded_job_v2**](TranscriptionV2Api.md#transcription_controller_init_pre_recorded_job_v2) | **POST** /v2/transcription | Initiate a new transcription job
[**transcription_controller_list_v2**](TranscriptionV2Api.md#transcription_controller_list_v2) | **GET** /v2/transcription | Get transcription jobs based on query parameters



## transcription_controller_delete_transcript_v2

> transcription_controller_delete_transcript_v2(id)
Delete the transcription job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the transcription job | [required] |

### Return type

 (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_controller_get_audio_v2

> std::path::PathBuf transcription_controller_get_audio_v2(id)
Download the audio file used for this transcription job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the transcription job | [required] |

### Return type

[**std::path::PathBuf**](std::path::PathBuf.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/octet-stream, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_controller_get_transcript_v2

> models::TranscriptionControllerGetTranscriptV2200Response transcription_controller_get_transcript_v2(id)
Get the transcription job's metadata

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the transcription job | [required] |

### Return type

[**models::TranscriptionControllerGetTranscriptV2200Response**](TranscriptionController_getTranscript_v2_200_response.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_controller_init_pre_recorded_job_v2

> models::InitPreRecordedTranscriptionResponse transcription_controller_init_pre_recorded_job_v2(init_transcription_request)
Initiate a new transcription job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**init_transcription_request** | [**InitTranscriptionRequest**](InitTranscriptionRequest.md) |  | [required] |

### Return type

[**models::InitPreRecordedTranscriptionResponse**](InitPreRecordedTranscriptionResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## transcription_controller_list_v2

> models::ListTranscriptionResponse transcription_controller_list_v2(offset, limit, date, before_date, after_date, status, custom_metadata, kind)
Get transcription jobs based on query parameters

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**offset** | Option<**i32**> | The starting point for pagination. A value of 0 starts from the first item. |  |[default to 0]
**limit** | Option<**i32**> | The maximum number of items to return. Useful for pagination and controlling data payload size. |  |[default to 20]
**date** | Option<**String**> | Filter items relevant to a specific date in ISO format (YYYY-MM-DD). |  |
**before_date** | Option<**String**> | Include items that occurred before the specified date in ISO format. |  |
**after_date** | Option<**String**> | Filter for items after the specified date. Use with `before_date` for a range. Date in ISO format. |  |
**status** | Option<[**Vec<String>**](String.md)> | Filter the list based on item status. Accepts multiple values from the predefined list. |  |
**custom_metadata** | Option<[**std::collections::HashMap<String, serde_json::Value>**](serde_json::Value.md)> |  |  |
**kind** | Option<[**Vec<String>**](String.md)> | Filter the list based on the item type. Supports multiple values from the predefined list. |  |

### Return type

[**models::ListTranscriptionResponse**](ListTranscriptionResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


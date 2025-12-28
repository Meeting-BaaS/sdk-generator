# \PreRecordedV2Api

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**pre_recorded_controller_delete_pre_recorded_job_v2**](PreRecordedV2Api.md#pre_recorded_controller_delete_pre_recorded_job_v2) | **DELETE** /v2/pre-recorded/{id} | Delete the pre recorded job
[**pre_recorded_controller_get_audio_v2**](PreRecordedV2Api.md#pre_recorded_controller_get_audio_v2) | **GET** /v2/pre-recorded/{id}/file | Download the audio file used for this pre recorded job
[**pre_recorded_controller_get_pre_recorded_job_v2**](PreRecordedV2Api.md#pre_recorded_controller_get_pre_recorded_job_v2) | **GET** /v2/pre-recorded/{id} | Get the pre recorded job's metadata
[**pre_recorded_controller_get_pre_recorded_jobs_v2**](PreRecordedV2Api.md#pre_recorded_controller_get_pre_recorded_jobs_v2) | **GET** /v2/pre-recorded | Get pre recorded jobs based on query parameters
[**pre_recorded_controller_init_pre_recorded_job_v2**](PreRecordedV2Api.md#pre_recorded_controller_init_pre_recorded_job_v2) | **POST** /v2/pre-recorded | Initiate a new pre recorded job



## pre_recorded_controller_delete_pre_recorded_job_v2

> pre_recorded_controller_delete_pre_recorded_job_v2(id)
Delete the pre recorded job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the pre recorded job | [required] |

### Return type

 (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## pre_recorded_controller_get_audio_v2

> std::path::PathBuf pre_recorded_controller_get_audio_v2(id)
Download the audio file used for this pre recorded job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the pre recorded job | [required] |

### Return type

[**std::path::PathBuf**](std::path::PathBuf.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/octet-stream, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## pre_recorded_controller_get_pre_recorded_job_v2

> models::PreRecordedResponse pre_recorded_controller_get_pre_recorded_job_v2(id)
Get the pre recorded job's metadata

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the pre recorded job | [required] |

### Return type

[**models::PreRecordedResponse**](PreRecordedResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## pre_recorded_controller_get_pre_recorded_jobs_v2

> models::ListPreRecordedResponse pre_recorded_controller_get_pre_recorded_jobs_v2(offset, limit, date, before_date, after_date, status, custom_metadata)
Get pre recorded jobs based on query parameters

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

### Return type

[**models::ListPreRecordedResponse**](ListPreRecordedResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## pre_recorded_controller_init_pre_recorded_job_v2

> models::InitPreRecordedTranscriptionResponse pre_recorded_controller_init_pre_recorded_job_v2(init_transcription_request)
Initiate a new pre recorded job

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


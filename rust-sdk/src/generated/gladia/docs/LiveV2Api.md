# \LiveV2Api

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**streaming_controller_delete_streaming_job_v2**](LiveV2Api.md#streaming_controller_delete_streaming_job_v2) | **DELETE** /v2/live/{id} | Delete the live job
[**streaming_controller_get_audio_v2**](LiveV2Api.md#streaming_controller_get_audio_v2) | **GET** /v2/live/{id}/file | Download the audio file used for this live job
[**streaming_controller_get_streaming_job_v2**](LiveV2Api.md#streaming_controller_get_streaming_job_v2) | **GET** /v2/live/{id} | Get the live job's metadata
[**streaming_controller_get_streaming_jobs_v2**](LiveV2Api.md#streaming_controller_get_streaming_jobs_v2) | **GET** /v2/live | Get live jobs based on query parameters
[**streaming_controller_init_streaming_session_v2**](LiveV2Api.md#streaming_controller_init_streaming_session_v2) | **POST** /v2/live | Initiate a new live job
[**streaming_controller_patch_request_params_v2**](LiveV2Api.md#streaming_controller_patch_request_params_v2) | **PATCH** /v2/live/{id} | For debugging purposes, send post session metadata in the request params of the job



## streaming_controller_delete_streaming_job_v2

> streaming_controller_delete_streaming_job_v2(id)
Delete the live job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the live job | [required] |

### Return type

 (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## streaming_controller_get_audio_v2

> std::path::PathBuf streaming_controller_get_audio_v2(id)
Download the audio file used for this live job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the live job | [required] |

### Return type

[**std::path::PathBuf**](std::path::PathBuf.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/octet-stream, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## streaming_controller_get_streaming_job_v2

> models::StreamingResponse streaming_controller_get_streaming_job_v2(id)
Get the live job's metadata

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the live job | [required] |

### Return type

[**models::StreamingResponse**](StreamingResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## streaming_controller_get_streaming_jobs_v2

> models::ListStreamingResponse streaming_controller_get_streaming_jobs_v2(offset, limit, date, before_date, after_date, status, custom_metadata)
Get live jobs based on query parameters

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

[**models::ListStreamingResponse**](ListStreamingResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## streaming_controller_init_streaming_session_v2

> models::InitStreamingResponse streaming_controller_init_streaming_session_v2(streaming_request, region)
Initiate a new live job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**streaming_request** | [**StreamingRequest**](StreamingRequest.md) |  | [required] |
**region** | Option<[**StreamingSupportedRegions**](.md)> | The region used to process the audio. |  |

### Return type

[**models::InitStreamingResponse**](InitStreamingResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## streaming_controller_patch_request_params_v2

> streaming_controller_patch_request_params_v2(id, body)
For debugging purposes, send post session metadata in the request params of the job

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**id** | **String** | Id of the live job | [required] |
**body** | **serde_json::Value** |  | [required] |

### Return type

 (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


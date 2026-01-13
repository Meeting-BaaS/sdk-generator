# Gladia.SDK.Api.PreRecordedV2Api

All URIs are relative to *https://api.gladia.io*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**PreRecordedControllerDeletePreRecordedJobV2**](PreRecordedV2Api.md#prerecordedcontrollerdeleteprerecordedjobv2) | **DELETE** /v2/pre-recorded/{id} | Delete the pre recorded job |
| [**PreRecordedControllerGetAudioV2**](PreRecordedV2Api.md#prerecordedcontrollergetaudiov2) | **GET** /v2/pre-recorded/{id}/file | Download the audio file used for this pre recorded job |
| [**PreRecordedControllerGetPreRecordedJobV2**](PreRecordedV2Api.md#prerecordedcontrollergetprerecordedjobv2) | **GET** /v2/pre-recorded/{id} | Get the pre recorded job&#39;s metadata |
| [**PreRecordedControllerGetPreRecordedJobsV2**](PreRecordedV2Api.md#prerecordedcontrollergetprerecordedjobsv2) | **GET** /v2/pre-recorded | Get pre recorded jobs based on query parameters |
| [**PreRecordedControllerInitPreRecordedJobV2**](PreRecordedV2Api.md#prerecordedcontrollerinitprerecordedjobv2) | **POST** /v2/pre-recorded | Initiate a new pre recorded job |

<a id="prerecordedcontrollerdeleteprerecordedjobv2"></a>
# **PreRecordedControllerDeletePreRecordedJobV2**
> void PreRecordedControllerDeletePreRecordedJobV2 (string id)

Delete the pre recorded job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the pre recorded job |  |

### Return type

void (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **202** | The pre recorded job has been successfully deleted |  -  |
| **401** | You don&#39;t have the permissions to delete this pre recorded job |  -  |
| **403** | The pre recorded job is not in a deletable state |  -  |
| **404** | The pre recorded job doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="prerecordedcontrollergetaudiov2"></a>
# **PreRecordedControllerGetAudioV2**
> System.IO.Stream PreRecordedControllerGetAudioV2 (string id)

Download the audio file used for this pre recorded job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the pre recorded job |  |

### Return type

**System.IO.Stream**

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The audio file used for this pre recorded job |  -  |
| **401** | You don&#39;t have the permissions to access this pre recorded job or its audio file |  -  |
| **404** | The pre recorded job or its audio file doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="prerecordedcontrollergetprerecordedjobv2"></a>
# **PreRecordedControllerGetPreRecordedJobV2**
> PreRecordedResponse PreRecordedControllerGetPreRecordedJobV2 (string id)

Get the pre recorded job's metadata


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the pre recorded job |  |

### Return type

[**PreRecordedResponse**](PreRecordedResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The pre recorded job&#39;s metadata |  -  |
| **401** | You don&#39;t have the permissions to access the pre recorded job |  -  |
| **404** | The pre recorded job doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="prerecordedcontrollergetprerecordedjobsv2"></a>
# **PreRecordedControllerGetPreRecordedJobsV2**
> ListPreRecordedResponse PreRecordedControllerGetPreRecordedJobsV2 (int offset = null, int limit = null, DateTime date = null, DateTime beforeDate = null, DateTime afterDate = null, List<string> status = null, Dictionary<string, Object> customMetadata = null)

Get pre recorded jobs based on query parameters


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **offset** | **int** | The starting point for pagination. A value of 0 starts from the first item. | [optional] [default to 0] |
| **limit** | **int** | The maximum number of items to return. Useful for pagination and controlling data payload size. | [optional] [default to 20] |
| **date** | **DateTime** | Filter items relevant to a specific date in ISO format (YYYY-MM-DD). | [optional]  |
| **beforeDate** | **DateTime** | Include items that occurred before the specified date in ISO format. | [optional]  |
| **afterDate** | **DateTime** | Filter for items after the specified date. Use with &#x60;before_date&#x60; for a range. Date in ISO format. | [optional]  |
| **status** | [**List&lt;string&gt;**](string.md) | Filter the list based on item status. Accepts multiple values from the predefined list. | [optional]  |
| **customMetadata** | [**Dictionary&lt;string, Object&gt;**](Object.md) |  | [optional]  |

### Return type

[**ListPreRecordedResponse**](ListPreRecordedResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | A list of pre recorded jobs matching the parameters. |  -  |
| **401** | You don&#39;t have the permissions to access pre recorded jobs |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="prerecordedcontrollerinitprerecordedjobv2"></a>
# **PreRecordedControllerInitPreRecordedJobV2**
> InitPreRecordedTranscriptionResponse PreRecordedControllerInitPreRecordedJobV2 (InitTranscriptionRequest initTranscriptionRequest)

Initiate a new pre recorded job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **initTranscriptionRequest** | [**InitTranscriptionRequest**](InitTranscriptionRequest.md) |  |  |

### Return type

[**InitPreRecordedTranscriptionResponse**](InitPreRecordedTranscriptionResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | The pre recorded job has been initiated |  -  |
| **400** | Something is wrong with the request |  -  |
| **401** | You don&#39;t have the permissions to initiate a new pre recorded job |  -  |
| **422** | The parameters you gave are incorrect |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)


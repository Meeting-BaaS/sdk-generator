# Gladia.SDK.Api.LiveV2Api

All URIs are relative to *https://api.gladia.io*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**StreamingControllerDeleteStreamingJobV2**](LiveV2Api.md#streamingcontrollerdeletestreamingjobv2) | **DELETE** /v2/live/{id} | Delete the live job |
| [**StreamingControllerGetAudioV2**](LiveV2Api.md#streamingcontrollergetaudiov2) | **GET** /v2/live/{id}/file | Download the audio file used for this live job |
| [**StreamingControllerGetStreamingJobV2**](LiveV2Api.md#streamingcontrollergetstreamingjobv2) | **GET** /v2/live/{id} | Get the live job&#39;s metadata |
| [**StreamingControllerGetStreamingJobsV2**](LiveV2Api.md#streamingcontrollergetstreamingjobsv2) | **GET** /v2/live | Get live jobs based on query parameters |
| [**StreamingControllerInitStreamingSessionV2**](LiveV2Api.md#streamingcontrollerinitstreamingsessionv2) | **POST** /v2/live | Initiate a new live job |
| [**StreamingControllerPatchRequestParamsV2**](LiveV2Api.md#streamingcontrollerpatchrequestparamsv2) | **PATCH** /v2/live/{id} | For debugging purposes, send post session metadata in the request params of the job |

<a id="streamingcontrollerdeletestreamingjobv2"></a>
# **StreamingControllerDeleteStreamingJobV2**
> void StreamingControllerDeleteStreamingJobV2 (string id)

Delete the live job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the live job |  |

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
| **202** | The live job has been successfully deleted |  -  |
| **401** | You don&#39;t have the permissions to delete this live job |  -  |
| **403** | The live job is not in a deletable state |  -  |
| **404** | The live job doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="streamingcontrollergetaudiov2"></a>
# **StreamingControllerGetAudioV2**
> System.IO.Stream StreamingControllerGetAudioV2 (string id)

Download the audio file used for this live job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the live job |  |

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
| **200** | The audio file used for this live job |  -  |
| **401** | You don&#39;t have the permissions to access this live job or its audio file |  -  |
| **404** | The live job or its audio file doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="streamingcontrollergetstreamingjobv2"></a>
# **StreamingControllerGetStreamingJobV2**
> StreamingResponse StreamingControllerGetStreamingJobV2 (string id)

Get the live job's metadata


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the live job |  |

### Return type

[**StreamingResponse**](StreamingResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The live job&#39;s metadata |  -  |
| **401** | You don&#39;t have the permissions to access the live job |  -  |
| **404** | The live job doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="streamingcontrollergetstreamingjobsv2"></a>
# **StreamingControllerGetStreamingJobsV2**
> ListStreamingResponse StreamingControllerGetStreamingJobsV2 (int offset = null, int limit = null, DateTime date = null, DateTime beforeDate = null, DateTime afterDate = null, List<string> status = null, Dictionary<string, Object> customMetadata = null)

Get live jobs based on query parameters


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

[**ListStreamingResponse**](ListStreamingResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | A list of live jobs matching the parameters. |  -  |
| **401** | You don&#39;t have the permissions to access live jobs |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="streamingcontrollerinitstreamingsessionv2"></a>
# **StreamingControllerInitStreamingSessionV2**
> InitStreamingResponse StreamingControllerInitStreamingSessionV2 (StreamingRequest streamingRequest, StreamingSupportedRegions region = null)

Initiate a new live job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **streamingRequest** | [**StreamingRequest**](StreamingRequest.md) |  |  |
| **region** | **StreamingSupportedRegions** | The region used to process the audio. | [optional]  |

### Return type

[**InitStreamingResponse**](InitStreamingResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | The live job has been initiated |  -  |
| **400** | Something is wrong with the request |  -  |
| **401** | You don&#39;t have the permissions to initiate a new live job |  -  |
| **422** | The parameters you gave are incorrect |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="streamingcontrollerpatchrequestparamsv2"></a>
# **StreamingControllerPatchRequestParamsV2**
> void StreamingControllerPatchRequestParamsV2 (string id, Object body)

For debugging purposes, send post session metadata in the request params of the job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the live job |  |
| **body** | **Object** |  |  |

### Return type

void (empty response body)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Successfully patched the job |  -  |
| **400** | Something is wrong with the request |  -  |
| **401** | You don&#39;t have the permissions to update the job |  -  |
| **404** | The live job doesn&#39;t exist or has been deleted |  -  |
| **413** | The post_request_metadata parameter must be a json object no longer that 100kb |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)


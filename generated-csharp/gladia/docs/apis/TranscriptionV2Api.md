# Gladia.SDK.Api.TranscriptionV2Api

All URIs are relative to *https://api.gladia.io*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**TranscriptionControllerDeleteTranscriptV2**](TranscriptionV2Api.md#transcriptioncontrollerdeletetranscriptv2) | **DELETE** /v2/transcription/{id} | Delete the transcription job |
| [**TranscriptionControllerGetAudioV2**](TranscriptionV2Api.md#transcriptioncontrollergetaudiov2) | **GET** /v2/transcription/{id}/file | Download the audio file used for this transcription job |
| [**TranscriptionControllerGetTranscriptV2**](TranscriptionV2Api.md#transcriptioncontrollergettranscriptv2) | **GET** /v2/transcription/{id} | Get the transcription job&#39;s metadata |
| [**TranscriptionControllerInitPreRecordedJobV2**](TranscriptionV2Api.md#transcriptioncontrollerinitprerecordedjobv2) | **POST** /v2/transcription | Initiate a new transcription job |
| [**TranscriptionControllerListV2**](TranscriptionV2Api.md#transcriptioncontrollerlistv2) | **GET** /v2/transcription | Get transcription jobs based on query parameters |

<a id="transcriptioncontrollerdeletetranscriptv2"></a>
# **TranscriptionControllerDeleteTranscriptV2**
> void TranscriptionControllerDeleteTranscriptV2 (string id)

Delete the transcription job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the transcription job |  |

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
| **202** | The transcription job has been successfully deleted |  -  |
| **401** | You don&#39;t have the permissions to delete this transcription job |  -  |
| **403** | The transcription job is not in a deletable state |  -  |
| **404** | The transcription job doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="transcriptioncontrollergetaudiov2"></a>
# **TranscriptionControllerGetAudioV2**
> System.IO.Stream TranscriptionControllerGetAudioV2 (string id)

Download the audio file used for this transcription job


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the transcription job |  |

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
| **200** | The audio file used for this transcription job |  -  |
| **401** | You don&#39;t have the permissions to access this transcription job or its audio file |  -  |
| **404** | The transcription job or its audio file doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="transcriptioncontrollergettranscriptv2"></a>
# **TranscriptionControllerGetTranscriptV2**
> TranscriptionControllerGetTranscriptV2200Response TranscriptionControllerGetTranscriptV2 (string id)

Get the transcription job's metadata


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** | Id of the transcription job |  |

### Return type

[**TranscriptionControllerGetTranscriptV2200Response**](TranscriptionControllerGetTranscriptV2200Response.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | The transcription job&#39;s metadata |  -  |
| **401** | You don&#39;t have the permissions to access the transcription job |  -  |
| **404** | The transcription job doesn&#39;t exist or has been deleted |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="transcriptioncontrollerinitprerecordedjobv2"></a>
# **TranscriptionControllerInitPreRecordedJobV2**
> InitPreRecordedTranscriptionResponse TranscriptionControllerInitPreRecordedJobV2 (InitTranscriptionRequest initTranscriptionRequest)

Initiate a new transcription job


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
| **201** | The transcription job has been initiated |  -  |
| **400** | Something is wrong with the request |  -  |
| **401** | You don&#39;t have the permissions to initiate a new transcription job |  -  |
| **422** | The parameters you gave are incorrect |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="transcriptioncontrollerlistv2"></a>
# **TranscriptionControllerListV2**
> ListTranscriptionResponse TranscriptionControllerListV2 (int offset = null, int limit = null, DateTime date = null, DateTime beforeDate = null, DateTime afterDate = null, List<string> status = null, Dictionary<string, Object> customMetadata = null, List<string> kind = null)

Get transcription jobs based on query parameters


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
| **kind** | [**List&lt;string&gt;**](string.md) | Filter the list based on the item type. Supports multiple values from the predefined list. | [optional]  |

### Return type

[**ListTranscriptionResponse**](ListTranscriptionResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | A list of transcription jobs matching the parameters. |  -  |
| **401** | You don&#39;t have the permissions to access transcription jobs |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)


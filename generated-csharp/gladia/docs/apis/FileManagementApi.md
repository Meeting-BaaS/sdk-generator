# Gladia.SDK.Api.FileManagementApi

All URIs are relative to *https://api.gladia.io*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**FileControllerUploadV2**](FileManagementApi.md#filecontrolleruploadv2) | **POST** /v2/upload | Upload an audio file or provide an audio URL for processing |

<a id="filecontrolleruploadv2"></a>
# **FileControllerUploadV2**
> AudioUploadResponse FileControllerUploadV2 (System.IO.Stream audio = null)

Upload an audio file or provide an audio URL for processing


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **audio** | **System.IO.Stream****System.IO.Stream** | The file to be uploaded. This should be an audio or video file. | [optional]  |

### Return type

[**AudioUploadResponse**](AudioUploadResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

 - **Content-Type**: multipart/form-data, application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)


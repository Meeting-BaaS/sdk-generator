# \FileManagementApi

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**file_controller_upload_v2**](FileManagementApi.md#file_controller_upload_v2) | **POST** /v2/upload | Upload an audio file or provide an audio URL for processing



## file_controller_upload_v2

> models::AudioUploadResponse file_controller_upload_v2(audio)
Upload an audio file or provide an audio URL for processing

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**audio** | Option<**std::path::PathBuf**> | The file to be uploaded. This should be an audio or video file. |  |

### Return type

[**models::AudioUploadResponse**](AudioUploadResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: multipart/form-data, application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


# \KeysApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_projects_keys_create**](KeysApi.md#manage_projects_keys_create) | **POST** /v1/projects/{project_id}/keys | Create a Project Key
[**manage_projects_keys_delete**](KeysApi.md#manage_projects_keys_delete) | **DELETE** /v1/projects/{project_id}/keys/{key_id} | Delete a Project Key
[**manage_v1_projects_keys_get**](KeysApi.md#manage_v1_projects_keys_get) | **GET** /v1/projects/{project_id}/keys/{key_id} | Get a Project Key
[**manage_v1_projects_keys_list**](KeysApi.md#manage_v1_projects_keys_list) | **GET** /v1/projects/{project_id}/keys | List Project Keys



## manage_projects_keys_create

> models::CreateKeyV1Response manage_projects_keys_create(project_id, create_key_v1_request)
Create a Project Key

Creates a new API key with specified settings for the project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**create_key_v1_request** | Option<[**CreateKeyV1Request**](CreateKeyV1Request.md)> | API key settings | [required] |

### Return type

[**models::CreateKeyV1Response**](CreateKeyV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_projects_keys_delete

> models::DeleteProjectKeyV1Response manage_projects_keys_delete(project_id, key_id)
Delete a Project Key

Deletes an API key for a specific project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**key_id** | **String** | The unique identifier of the API key | [required] |

### Return type

[**models::DeleteProjectKeyV1Response**](DeleteProjectKeyV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_keys_get

> models::GetProjectKeyV1Response manage_v1_projects_keys_get(project_id, key_id)
Get a Project Key

Retrieves information about a specified API key

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**key_id** | **String** | The unique identifier of the API key | [required] |

### Return type

[**models::GetProjectKeyV1Response**](GetProjectKeyV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_keys_list

> models::ListProjectKeysV1Response manage_v1_projects_keys_list(project_id, status)
List Project Keys

Retrieves all API keys associated with the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**status** | Option<**String**> | Only return keys with a specific status |  |

### Return type

[**models::ListProjectKeysV1Response**](ListProjectKeysV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


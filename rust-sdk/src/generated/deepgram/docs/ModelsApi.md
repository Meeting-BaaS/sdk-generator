# \ModelsApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**agent_v1_settings_think_models_list**](ModelsApi.md#agent_v1_settings_think_models_list) | **GET** /v1/agent/settings/think/models | List Agent Think Models
[**manage_v1_models_get**](ModelsApi.md#manage_v1_models_get) | **GET** /v1/models/{model_id} | Get a specific Model
[**manage_v1_models_list**](ModelsApi.md#manage_v1_models_list) | **GET** /v1/models | List Models
[**manage_v1_projects_models_get**](ModelsApi.md#manage_v1_projects_models_get) | **GET** /v1/projects/{project_id}/models/{model_id} | Get a Project Model
[**manage_v1_projects_models_list**](ModelsApi.md#manage_v1_projects_models_list) | **GET** /v1/projects/{project_id}/models | List Project Models



## agent_v1_settings_think_models_list

> models::AgentThinkModelsV1Response agent_v1_settings_think_models_list()
List Agent Think Models

Retrieves the available think models that can be used for AI agent processing

### Parameters

This endpoint does not need any parameter.

### Return type

[**models::AgentThinkModelsV1Response**](AgentThinkModelsV1Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_models_get

> models::GetModelV1Response manage_v1_models_get(model_id)
Get a specific Model

Returns metadata for a specific public model

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**model_id** | **String** | The specific UUID of the model | [required] |

### Return type

[**models::GetModelV1Response**](GetModelV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_models_list

> models::ListModelsV1Response manage_v1_models_list(include_outdated)
List Models

Returns metadata on all the latest public models. To retrieve custom models, use Get Project Models.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**include_outdated** | Option<**bool**> | returns non-latest versions of models |  |

### Return type

[**models::ListModelsV1Response**](ListModelsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_models_get

> models::GetModelV1Response manage_v1_projects_models_get(project_id, model_id)
Get a Project Model

Returns metadata for a specific model

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**model_id** | **String** | The specific UUID of the model | [required] |

### Return type

[**models::GetModelV1Response**](GetModelV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_models_list

> models::ListModelsV1Response manage_v1_projects_models_list(project_id, include_outdated)
List Project Models

Returns metadata on all the latest models that a specific project has access to, including non-public models

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**include_outdated** | Option<**bool**> | returns non-latest versions of models |  |

### Return type

[**models::ListModelsV1Response**](ListModelsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


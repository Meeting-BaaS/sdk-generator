# \DistributionCredentialsApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**self_hosted_v1_distribution_credentials_create**](DistributionCredentialsApi.md#self_hosted_v1_distribution_credentials_create) | **POST** /v1/projects/{project_id}/self-hosted/distribution/credentials | Create a Project Self-Hosted Distribution Credential
[**self_hosted_v1_distribution_credentials_delete**](DistributionCredentialsApi.md#self_hosted_v1_distribution_credentials_delete) | **DELETE** /v1/projects/{project_id}/self-hosted/distribution/credentials/{distribution_credentials_id} | Delete a Project Self-Hosted Distribution Credential
[**self_hosted_v1_distribution_credentials_get**](DistributionCredentialsApi.md#self_hosted_v1_distribution_credentials_get) | **GET** /v1/projects/{project_id}/self-hosted/distribution/credentials/{distribution_credentials_id} | Get a Project Self-Hosted Distribution Credential
[**self_hosted_v1_distribution_credentials_list**](DistributionCredentialsApi.md#self_hosted_v1_distribution_credentials_list) | **GET** /v1/projects/{project_id}/self-hosted/distribution/credentials | List Project Self-Hosted Distribution Credentials



## self_hosted_v1_distribution_credentials_create

> models::CreateProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_create(project_id, scopes, provider, create_project_distribution_credentials_v1_request)
Create a Project Self-Hosted Distribution Credential

Creates a set of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**scopes** | Option<[**Vec<String>**](String.md)> | List of permission scopes for the credentials |  |[default to [self-hosted:products]]
**provider** | Option<**String**> | The provider of the distribution service |  |[default to quay]
**create_project_distribution_credentials_v1_request** | Option<[**CreateProjectDistributionCredentialsV1Request**](CreateProjectDistributionCredentialsV1Request.md)> | The set of distribution credentials to create |  |

### Return type

[**models::CreateProjectDistributionCredentialsV1Response**](CreateProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_delete

> models::GetProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_delete(project_id, distribution_credentials_id)
Delete a Project Self-Hosted Distribution Credential

Deletes a set of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**distribution_credentials_id** | **String** | The UUID of the distribution credentials | [required] |

### Return type

[**models::GetProjectDistributionCredentialsV1Response**](GetProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_get

> models::GetProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_get(project_id, distribution_credentials_id)
Get a Project Self-Hosted Distribution Credential

Returns a set of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**distribution_credentials_id** | **String** | The UUID of the distribution credentials | [required] |

### Return type

[**models::GetProjectDistributionCredentialsV1Response**](GetProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## self_hosted_v1_distribution_credentials_list

> models::ListProjectDistributionCredentialsV1Response self_hosted_v1_distribution_credentials_list(project_id)
List Project Self-Hosted Distribution Credentials

Lists sets of distribution credentials for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::ListProjectDistributionCredentialsV1Response**](ListProjectDistributionCredentialsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


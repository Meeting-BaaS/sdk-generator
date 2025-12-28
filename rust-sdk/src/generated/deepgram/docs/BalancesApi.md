# \BalancesApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_billing_balances_get**](BalancesApi.md#manage_v1_projects_billing_balances_get) | **GET** /v1/projects/{project_id}/balances/{balance_id} | Get a Project Balance
[**manage_v1_projects_billing_balances_list**](BalancesApi.md#manage_v1_projects_billing_balances_list) | **GET** /v1/projects/{project_id}/balances | Get Project Balances



## manage_v1_projects_billing_balances_get

> models::GetProjectBalanceV1Response manage_v1_projects_billing_balances_get(project_id, balance_id)
Get a Project Balance

Retrieves details about the specified balance

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**balance_id** | **String** | The unique identifier of the balance | [required] |

### Return type

[**models::GetProjectBalanceV1Response**](GetProjectBalanceV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_balances_list

> models::ListProjectBalancesV1Response manage_v1_projects_billing_balances_list(project_id)
Get Project Balances

Generates a list of outstanding balances for the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |

### Return type

[**models::ListProjectBalancesV1Response**](ListProjectBalancesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


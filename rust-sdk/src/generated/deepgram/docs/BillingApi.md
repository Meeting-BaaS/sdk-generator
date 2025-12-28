# \BillingApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_billing_balances_get**](BillingApi.md#manage_v1_projects_billing_balances_get) | **GET** /v1/projects/{project_id}/balances/{balance_id} | Get a Project Balance
[**manage_v1_projects_billing_balances_list**](BillingApi.md#manage_v1_projects_billing_balances_list) | **GET** /v1/projects/{project_id}/balances | Get Project Balances
[**manage_v1_projects_billing_breakdown_list**](BillingApi.md#manage_v1_projects_billing_breakdown_list) | **GET** /v1/projects/{project_id}/billing/breakdown | Get Project Billing Breakdown
[**manage_v1_projects_billing_fields_list**](BillingApi.md#manage_v1_projects_billing_fields_list) | **GET** /v1/projects/{project_id}/billing/fields | List Project Billing Fields
[**manage_v1_projects_billing_purchases_list**](BillingApi.md#manage_v1_projects_billing_purchases_list) | **GET** /v1/projects/{project_id}/purchases | List Project Purchases



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


## manage_v1_projects_billing_breakdown_list

> models::BillingBreakdownV1Response manage_v1_projects_billing_breakdown_list(project_id, start, end, accessor, deployment, tag, line_item, grouping)
Get Project Billing Breakdown

Retrieves the billing summary for a specific project, with various filter options or by grouping options.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |
**accessor** | Option<**String**> | Filter for requests where a specific accessor was used |  |
**deployment** | Option<**String**> | Filter for requests where a specific deployment was used |  |
**tag** | Option<**String**> | Filter for requests where a specific tag was used |  |
**line_item** | Option<**String**> | Filter requests by line item (e.g. streaming::nova-3) |  |
**grouping** | Option<[**Vec<String>**](String.md)> | Group billing breakdown by one or more dimensions (accessor, deployment, line_item, tags) |  |

### Return type

[**models::BillingBreakdownV1Response**](BillingBreakdownV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_fields_list

> models::ListBillingFieldsV1Response manage_v1_projects_billing_fields_list(project_id, start, end)
List Project Billing Fields

Lists the accessors, deployment types, tags, and line items used for billing data in the specified time period. Use this endpoint if you want to filter your results from the Billing Breakdown endpoint and want to know what filters are available.

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |

### Return type

[**models::ListBillingFieldsV1Response**](ListBillingFieldsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


## manage_v1_projects_billing_purchases_list

> models::ListProjectPurchasesV1Response manage_v1_projects_billing_purchases_list(project_id, limit)
List Project Purchases

Returns the original purchased amount on an order transaction

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**limit** | Option<**f64**> | Number of results to return per page. Default 10. Range [1,1000] |  |[default to 10]

### Return type

[**models::ListProjectPurchasesV1Response**](ListProjectPurchasesV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


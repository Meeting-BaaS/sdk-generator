# \FieldsApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_billing_fields_list**](FieldsApi.md#manage_v1_projects_billing_fields_list) | **GET** /v1/projects/{project_id}/billing/fields | List Project Billing Fields
[**manage_v1_projects_usage_fields_list**](FieldsApi.md#manage_v1_projects_usage_fields_list) | **GET** /v1/projects/{project_id}/usage/fields | List Project Usage Fields



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


## manage_v1_projects_usage_fields_list

> models::UsageFieldsV1Response manage_v1_projects_usage_fields_list(project_id, start, end)
List Project Usage Fields

Lists the features, models, tags, languages, and processing method used for requests in the specified project

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**project_id** | **String** | The unique identifier of the project | [required] |
**start** | Option<**String**> | Start date of the requested date range. Format accepted is YYYY-MM-DD |  |
**end** | Option<**String**> | End date of the requested date range. Format accepted is YYYY-MM-DD |  |

### Return type

[**models::UsageFieldsV1Response**](UsageFieldsV1Response.md)

### Authorization

[ApiKeyAuth](../README.md#ApiKeyAuth)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)


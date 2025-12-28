# \PurchasesApi

All URIs are relative to *https://api.deepgram.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**manage_v1_projects_billing_purchases_list**](PurchasesApi.md#manage_v1_projects_billing_purchases_list) | **GET** /v1/projects/{project_id}/purchases | List Project Purchases



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


# \JobHistoryApi

All URIs are relative to *https://api.gladia.io*

Method | HTTP request | Description
------------- | ------------- | -------------
[**history_controller_get_list_v1**](JobHistoryApi.md#history_controller_get_list_v1) | **GET** /v1/history | Get the history of all your jobs



## history_controller_get_list_v1

> models::ListHistoryResponse history_controller_get_list_v1(offset, limit, date, before_date, after_date, status, custom_metadata, kind)
Get the history of all your jobs

### Parameters


Name | Type | Description  | Required | Notes
------------- | ------------- | ------------- | ------------- | -------------
**offset** | Option<**i32**> | The starting point for pagination. A value of 0 starts from the first item. |  |[default to 0]
**limit** | Option<**i32**> | The maximum number of items to return. Useful for pagination and controlling data payload size. |  |[default to 20]
**date** | Option<**String**> | Filter items relevant to a specific date in ISO format (YYYY-MM-DD). |  |
**before_date** | Option<**String**> | Include items that occurred before the specified date in ISO format. |  |
**after_date** | Option<**String**> | Filter for items after the specified date. Use with `before_date` for a range. Date in ISO format. |  |
**status** | Option<[**Vec<String>**](String.md)> | Filter the list based on item status. Accepts multiple values from the predefined list. |  |
**custom_metadata** | Option<[**std::collections::HashMap<String, serde_json::Value>**](serde_json::Value.md)> |  |  |
**kind** | Option<[**Vec<String>**](String.md)> | Filter the list based on the item type. Supports multiple values from the predefined list. |  |

### Return type

[**models::ListHistoryResponse**](ListHistoryResponse.md)

### Authorization

[x_gladia_key](../README.md#x_gladia_key)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

